import { ApiErrorKind, InjectedFailure, ItemErrorKind } from '@/constants/enums';
import { StageId } from '@/constants/enums';
import { STAGE_IDS } from '@/constants/pipeline';
import type {
  DealsSummary,
  ItemResult,
  ListRequest,
  ListResponse,
  RemoteChange,
  SimulationConfig,
  UpdateItem,
} from '@/types/api';
import type { Deal, DealId, DealPatch, DealQuery, Owner } from '@/types/deal';
import { createRandom, pick, randomInt } from '@/utils/prng';

import { evaluateQuery, queryCacheKey, searchHaystack, sortMatches } from './deal-query';
import { patchIsNoop, validatePatch } from './deal-rules';

export const DEFAULT_SIMULATION: SimulationConfig = {
  latencyMinMs: 300,
  latencyMaxMs: 1500,
  failureRate: 0.1,
  online: true,
  teammateRate: 0,
};

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TEAMMATES = ['Priya Nair', 'Rohan Iyer', 'Neha Kapoor'];
const TICK_MS = 250;
const MS_PER_SECOND = 1000;
const OFFLINE_ERROR_DELAY_MS = 150;
const FAILURE_SPLIT = { requestLost: 0.6, responseLost: 0.85 } as const;
const CHANGE_LOG_LIMIT = 5000;
const ORDER_CACHE_MS = 60_000;
const ORDER_CACHE_SIZE = 8;
const SERVED_MEMORY = 400;
const SERVED_BIAS = 0.9;

export class FakeApi {
  private deals: Deal[] = [];
  private loaded = false;
  private haystacks: string[] = [];
  private servedIds: DealId[] = [];
  private readonly orders = new Map<string, { at: number; matches: number[] }>();
  private readonly indexById = new Map<DealId, number>();
  private config: SimulationConfig;
  private readonly random = createRandom(42);
  private readonly forced: InjectedFailure[] = [];
  private readonly listeners = new Set<(change: RemoteChange) => void>();
  private readonly configListeners = new Set<() => void>();
  private log: Array<{ revision: number; dealId: DealId }> = [];
  private revision = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly createDeals: () => ReadonlyArray<Deal>,
    private readonly owners: ReadonlyArray<Owner>,
    config: Partial<SimulationConfig> = {},
    private readonly now: () => number = () => Date.now(),
  ) {
    this.config = { ...DEFAULT_SIMULATION, ...config };
  }

  getConfig = (): SimulationConfig => this.config;

  setConfig = (patch: Partial<SimulationConfig>) => {
    this.config = { ...this.config, ...patch };
    this.restartTeammates();
    this.configListeners.forEach((listener) => {
      listener();
    });
  };

  subscribeConfig = (listener: () => void) => {
    this.configListeners.add(listener);
    return () => {
      this.configListeners.delete(listener);
    };
  };

  failNext = (kind: InjectedFailure, count = 1) => {
    for (let i = 0; i < count; i++) this.forced.push(kind);
  };

  onRemoteChange = (listener: (change: RemoteChange) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start = () => {
    this.restartTeammates();
  };

  stop = () => {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  changesSince = (revision: number): { deals: Deal[]; revision: number } => {
    const ids = new Set(this.log.filter((entry) => entry.revision > revision).map((e) => e.dealId));
    return { deals: [...ids].flatMap((id) => this.find(id) ?? []), revision: this.revision };
  };

  getRevision = (): number => this.revision;

  list = async ({ query, offset, limit }: ListRequest): Promise<ListResponse> => {
    await this.reach();
    this.maybeFail();
    if (offset === 0) this.orders.delete(queryCacheKey(query));
    const matches = this.orderOf(query);
    const items = matches.slice(offset, offset + limit).flatMap((index) => this.deals[index] ?? []);
    this.servedIds = [...this.servedIds, ...items.map((deal) => deal.id)].slice(-SERVED_MEMORY);
    return { items, total: matches.length, offset };
  };

  listMatching = async (query: DealQuery): Promise<Deal[]> => {
    await this.reach();
    this.maybeFail();
    this.orders.delete(queryCacheKey(query));
    return this.orderOf(query).flatMap((index) => this.deals[index] ?? []);
  };

  summary = async (query: DealQuery): Promise<DealsSummary> => {
    await this.reach();
    this.ensureLoaded();
    const evaluation = evaluateQuery(this.deals, query, this.now(), this.haystacks);
    return {
      total: evaluation.matches.length,
      totalValueInr: evaluation.totalValueInr,
      idleCount: evaluation.staleCount,
      byStage: evaluation.byStage,
    };
  };

  update = async (items: ReadonlyArray<UpdateItem>): Promise<ItemResult[]> => {
    if (!this.config.online) {
      await this.wait(OFFLINE_ERROR_DELAY_MS);
      throw new ApiError(ApiErrorKind.Offline, 'You are offline');
    }
    await this.wait(this.latency());
    const failure = this.nextFailure();
    if (failure === InjectedFailure.RequestLost)
      throw new ApiError(ApiErrorKind.Network, 'The request did not reach the server');
    if (failure === InjectedFailure.ServerError)
      throw new ApiError(ApiErrorKind.Server, 'The server had a problem (503)');
    const results = items.map(this.apply);
    if (failure === InjectedFailure.ResponseLost)
      throw new ApiError(ApiErrorKind.Network, 'The response was lost on the way back');
    return results;
  };

  editAsTeammate = (dealId?: DealId): Deal | null => {
    this.ensureLoaded();
    const target = dealId ? this.find(dealId) : this.pickTeammateTarget();
    if (!target) return null;
    const patch = this.randomPatch(target);
    if (!patch) return null;
    const result = this.apply({ dealId: target.id, patch, expectedVersion: target.version });
    if (!result.ok) return null;
    if (this.config.online) {
      const by = pick(this.random, TEAMMATES);
      this.listeners.forEach((listener) => {
        listener({ deal: result.deal, by });
      });
    }
    return result.deal;
  };

  private apply = (item: UpdateItem): ItemResult => {
    const current = this.find(item.dealId);
    if (!current)
      return {
        dealId: item.dealId,
        ok: false,
        kind: ItemErrorKind.NotFound,
        message: 'This deal no longer exists',
      };
    if (current.version !== item.expectedVersion)
      return {
        dealId: item.dealId,
        ok: false,
        kind: ItemErrorKind.Conflict,
        message: 'Someone else changed this deal first',
        current,
      };
    const violation = validatePatch(current, item.patch, (id) =>
      this.owners.some((o) => o.id === id),
    );
    if (violation)
      return {
        dealId: item.dealId,
        ok: false,
        kind: ItemErrorKind.Validation,
        message: violation.message,
      };
    if (patchIsNoop(current, item.patch)) return { dealId: item.dealId, ok: true, deal: current };
    const at = new Date(this.now()).toISOString();
    const deal: Deal = {
      ...current,
      ...item.patch,
      version: current.version + 1,
      updatedAt: at,
      lastActivityAt: at,
    };
    const index = this.indexById.get(deal.id);
    if (index !== undefined) this.deals[index] = deal;
    this.revisionBump(deal.id);
    return { dealId: item.dealId, ok: true, deal };
  };

  private revisionBump = (dealId: DealId) => {
    this.revision += 1;
    this.log.push({ revision: this.revision, dealId });
    if (this.log.length > CHANGE_LOG_LIMIT) this.log = this.log.slice(-CHANGE_LOG_LIMIT);
  };

  private pickTeammateTarget = (): Deal | undefined => {
    if (this.servedIds.length > 0 && this.random() < SERVED_BIAS) {
      const id = pick(this.random, this.servedIds);
      return this.find(id);
    }
    return this.deals[randomInt(this.random, 0, this.deals.length - 1)];
  };

  private ensureLoaded = () => {
    if (this.loaded) return;
    this.loaded = true;
    this.deals = [...this.createDeals()];
    this.deals.forEach((deal, index) => this.indexById.set(deal.id, index));
    this.haystacks = this.deals.map(searchHaystack);
  };

  private orderOf = (query: DealQuery): number[] => {
    this.ensureLoaded();
    const key = queryCacheKey(query);
    const cached = this.orders.get(key);
    if (cached && performance.now() - cached.at < ORDER_CACHE_MS) return cached.matches;
    const evaluation = evaluateQuery(this.deals, query, this.now(), this.haystacks);
    const matches = sortMatches(this.deals, evaluation.matches, query.sort);
    this.orders.set(key, { at: performance.now(), matches });
    if (this.orders.size > ORDER_CACHE_SIZE) {
      const oldest = this.orders.keys().next().value;
      if (oldest !== undefined) this.orders.delete(oldest);
    }
    return matches;
  };

  private reach = async () => {
    if (!this.config.online) {
      await this.wait(OFFLINE_ERROR_DELAY_MS);
      throw new ApiError(ApiErrorKind.Offline, 'You are offline');
    }
    await this.wait(this.latency());
  };

  private maybeFail = () => {
    if (this.nextFailure())
      throw new ApiError(ApiErrorKind.Server, 'The server had a problem (503)');
  };

  private find = (id: DealId): Deal | undefined => {
    this.ensureLoaded();
    const index = this.indexById.get(id);
    return index === undefined ? undefined : this.deals[index];
  };

  private latency = (): number => {
    const { latencyMinMs, latencyMaxMs } = this.config;
    return latencyMaxMs <= 0
      ? 0
      : latencyMinMs + this.random() * Math.max(0, latencyMaxMs - latencyMinMs);
  };

  private nextFailure = (): InjectedFailure | null => {
    const forced = this.forced.shift();
    if (forced) return forced;
    if (this.random() >= this.config.failureRate) return null;
    const roll = this.random();
    if (roll < FAILURE_SPLIT.requestLost) return InjectedFailure.RequestLost;
    return roll < FAILURE_SPLIT.responseLost
      ? InjectedFailure.ResponseLost
      : InjectedFailure.ServerError;
  };

  private wait = (ms: number): Promise<void> =>
    ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));

  private randomPatch = (deal: Deal): DealPatch | null => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const roll = this.random();
      const patch: DealPatch =
        roll < 0.6
          ? { stage: pick(this.random, STAGE_IDS) }
          : roll < 0.8
            ? { ownerId: pick(this.random, this.owners).id }
            : {
                valueInr: Math.max(
                  1000,
                  Math.round((deal.valueInr * (0.8 + this.random() * 0.5)) / 1000) * 1000,
                ),
              };
      if (patch.stage === StageId.Won || patch.stage === StageId.Lost) continue;
      if (!patchIsNoop(deal, patch) && !validatePatch(deal, patch, () => true)) return patch;
    }
    return null;
  };

  private restartTeammates = () => {
    this.stop();
    if (this.config.teammateRate <= 0) return;
    const expected = (this.config.teammateRate * TICK_MS) / MS_PER_SECOND;
    this.timer = setInterval(() => {
      let count = Math.floor(expected);
      if (this.random() < expected - count) count += 1;
      for (let i = 0; i < count; i++) this.editAsTeammate();
    }, TICK_MS);
  };
}

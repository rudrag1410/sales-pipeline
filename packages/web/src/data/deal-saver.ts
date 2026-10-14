import type { QueryClient } from '@tanstack/react-query';

import { ItemErrorKind, SaveStatus } from '@/constants/enums';
import type { ItemResult, UpdateItem } from '@/types/api';
import type { SaveSummary } from '@/types/api';
import type { Deal, DealId } from '@/types/deal';
import type { DealChange } from '@/types/store';

import type { DealsStore } from './deals-store';
import type { FakeApi } from './fake-api';

const UPDATE_DEALS_KEY = ['deals', 'update'];
const CHUNK_SIZE = 50;
const CONCURRENCY = 3;

const emptySummary = (): SaveSummary => ({
  saved: 0,
  failed: 0,
  conflicts: 0,
  rejected: 0,
  refused: 0,
});

const chunk = <T>(items: ReadonlyArray<T>, size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );

export class DealSaver {
  constructor(
    private readonly store: DealsStore,
    private readonly api: FakeApi,
    private readonly queryClient: QueryClient,
  ) {}

  save = async (changes: ReadonlyArray<DealChange>): Promise<SaveSummary> => {
    const { send, refused } = this.store.edit(changes);
    const summary = await this.send(send);
    summary.refused = refused.length;
    return summary;
  };

  retry = (dealId: DealId): Promise<SaveSummary> => {
    const item = this.store.retry(dealId);
    return this.send(item ? [item] : []);
  };

  retryAllFailed = (): Promise<SaveSummary> => {
    const items: UpdateItem[] = [];
    for (const [dealId, state] of this.store.getSaveStates()) {
      const item = state.status === SaveStatus.Failed ? this.store.retry(dealId) : null;
      if (item) items.push(item);
    }
    return this.send(items);
  };

  applyMine = (dealId: DealId): Promise<SaveSummary> => {
    const item = this.store.applyMine(dealId);
    return this.send(item ? [item] : []);
  };

  connect = (): (() => void) => {
    this.api.start();
    let wasOnline = this.api.getConfig().online;
    let offlineAtRevision = 0;
    const stopRemote = this.api.onRemoteChange(({ deal, by }) => {
      this.store.applyRemote(deal, by);
    });
    const stopConfig = this.api.subscribeConfig(() => {
      const online = this.api.getConfig().online;
      if (wasOnline && !online) offlineAtRevision = this.api.getRevision();
      if (!wasOnline && online) this.catchUp(offlineAtRevision);
      wasOnline = online;
    });
    return () => {
      stopRemote();
      stopConfig();
      this.api.stop();
    };
  };

  private catchUp = (sinceRevision: number) => {
    const { deals } = this.api.changesSince(sinceRevision);
    this.store.batch(() => {
      deals.forEach((deal) => {
        this.store.applyRemote(deal, 'A teammate');
      });
    });
  };

  private send = async (items: ReadonlyArray<UpdateItem>): Promise<SaveSummary> => {
    const summary = emptySummary();
    const queue = chunk(items, CHUNK_SIZE);
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        await this.sendChunk(next, summary);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    return summary;
  };

  private sendChunk = async (items: ReadonlyArray<UpdateItem>, summary: SaveSummary) => {
    let results: ItemResult[];
    try {
      results = await this.queryClient
        .getMutationCache()
        .build(this.queryClient, {
          mutationKey: UPDATE_DEALS_KEY,
          mutationFn: (batch: ReadonlyArray<UpdateItem>) => this.api.update(batch),
        })
        .execute(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The save failed';
      this.store.batch(() => {
        items.forEach((item) => {
          this.store.markFailed(item.dealId, message);
        });
      });
      summary.failed += items.length;
      return;
    }
    this.store.batch(() => {
      const byId = new Map(items.map((item) => [item.dealId, item]));
      for (const result of results) this.record(result, byId.get(result.dealId), summary);
    });
  };

  private record = (result: ItemResult, item: UpdateItem | undefined, summary: SaveSummary) => {
    if (result.ok) {
      this.store.markSaved(result.deal);
      summary.saved += 1;
      return;
    }
    if (result.kind === ItemErrorKind.Conflict && result.current) {
      if (item && alreadyApplied(result.current, item)) {
        this.store.markSaved(result.current);
        summary.saved += 1;
      } else {
        this.store.markConflict(result.current);
        summary.conflicts += 1;
      }
      return;
    }
    this.store.markRejected(result.dealId, result.message, result.current);
    summary.rejected += 1;
  };
}

const alreadyApplied = (current: Deal, item: UpdateItem): boolean =>
  Object.entries(item.patch).every(([field, value]) => current[field as keyof Deal] === value);

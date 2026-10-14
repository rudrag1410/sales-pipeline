import { createStore } from 'zustand/vanilla';

import { SaveStatus } from '@/constants/enums';
import { SEED_REFERENCE_TIME } from '@/constants/pipeline';
import type { UpdateItem } from '@/types/api';
import type { ChangeEntry, Deal, DealId, Owner } from '@/types/deal';
import type { DealChange, EditResult, SaveState } from '@/types/store';

import { searchHaystack } from './deal-query';
import { patchIsNoop, validatePatch } from './deal-rules';
import { generateOwners } from './seed-data';

const HISTORY_LIMIT = 30;

interface PipelineState {
  loaded: boolean;
  deals: ReadonlyArray<Deal>;
  saveStates: ReadonlyMap<DealId, SaveState>;
  remoteMarks: ReadonlyMap<DealId, string>;
}

interface Draft {
  deals: Deal[];
  dealsCopied: boolean;
  saveStates: Map<DealId, SaveState>;
  remoteMarks: Map<DealId, string>;
}

export class DealsStore {
  readonly owners: ReadonlyArray<Owner> = generateOwners();
  haystacks: ReadonlyArray<string> = [];
  readonly zustand;
  private readonly indexById = new Map<DealId, number>();
  private readonly history = new Map<DealId, ChangeEntry[]>();
  private readonly bootedAt = performance.now();
  private draft: Draft | null = null;

  constructor() {
    this.zustand = createStore<PipelineState>(() => ({
      loaded: false,
      deals: [],
      saveStates: new Map(),
      remoteMarks: new Map(),
    }));
  }

  load = (deals: ReadonlyArray<Deal>) => {
    this.indexById.clear();
    deals.forEach((deal, index) => this.indexById.set(deal.id, index));
    this.haystacks = deals.map(searchHaystack);
    this.zustand.setState({ loaded: true, deals });
  };

  isLoaded = (): boolean => this.zustand.getState().loaded;

  subscribe = (listener: () => void) => this.zustand.subscribe(listener);
  getDeals = (): ReadonlyArray<Deal> => this.zustand.getState().deals;
  getSaveStates = (): ReadonlyMap<DealId, SaveState> => this.zustand.getState().saveStates;
  getRemoteMarks = (): ReadonlyMap<DealId, string> => this.zustand.getState().remoteMarks;

  get = (id: DealId): Deal | undefined => {
    const index = this.indexById.get(id);
    return index === undefined ? undefined : (this.draft?.deals ?? this.getDeals())[index];
  };

  historyOf = (id: DealId): ReadonlyArray<ChangeEntry> =>
    [...(this.history.get(id) ?? [])].reverse();

  now = (): number => SEED_REFERENCE_TIME + (performance.now() - this.bootedAt);

  batch = (run: () => void) => {
    this.transact(run);
  };

  edit = (changes: ReadonlyArray<DealChange>): EditResult =>
    this.transact((draft) => {
      const send: UpdateItem[] = [];
      const refused: Array<{ dealId: DealId; message: string; busy: boolean }> = [];
      const owners = new Set(this.owners.map((owner) => owner.id));
      for (const { dealId, patch } of changes) {
        const current = this.get(dealId);
        if (!current) {
          refused.push({ dealId, message: 'Deal not found', busy: false });
          continue;
        }
        const state = draft.saveStates.get(dealId);
        if (state?.status === SaveStatus.Saving) {
          refused.push({ dealId, message: 'Still saving the previous change', busy: true });
          continue;
        }
        if (patchIsNoop(current, patch)) continue;
        const violation = validatePatch(current, patch, (id) => owners.has(id));
        if (violation) {
          refused.push({ dealId, message: violation.message, busy: false });
          continue;
        }
        this.write(draft, { ...current, ...patch });
        draft.saveStates.set(dealId, {
          status: SaveStatus.Saving,
          patch,
          before: state?.before ?? current,
        });
        send.push({ dealId, patch, expectedVersion: current.version });
      }
      return { send, refused };
    });

  markSaved = (saved: Deal, by = 'You') => {
    this.transact((draft) => {
      const state = draft.saveStates.get(saved.id);
      draft.saveStates.delete(saved.id);
      if (state) this.record(state.before, saved, by);
      this.write(draft, saved);
    });
  };

  markFailed = (dealId: DealId, message: string) => {
    this.transact((draft) => {
      const state = draft.saveStates.get(dealId);
      if (state) draft.saveStates.set(dealId, { ...state, status: SaveStatus.Failed, message });
    });
  };

  markConflict = (current: Deal) => {
    this.transact((draft) => {
      const state = draft.saveStates.get(current.id);
      if (!state) return;
      draft.saveStates.set(current.id, {
        ...state,
        status: SaveStatus.Conflict,
        theirs: current,
        message: 'Someone else changed this deal first',
      });
      this.record(state.before, current, 'Someone else');
      this.write(draft, current);
    });
  };

  markRejected = (dealId: DealId, message: string, current?: Deal) => {
    this.transact((draft) => {
      const state = draft.saveStates.get(dealId);
      if (!state) return;
      draft.saveStates.set(dealId, { ...state, status: SaveStatus.Rejected, message });
      this.write(draft, current ?? state.before);
    });
  };

  retry = (dealId: DealId): UpdateItem | null =>
    this.transact((draft) => {
      const state = draft.saveStates.get(dealId);
      const current = this.get(dealId);
      if (state?.status !== SaveStatus.Failed || !current) return null;
      const { message: _message, ...rest } = state;
      draft.saveStates.set(dealId, { ...rest, status: SaveStatus.Saving });
      return { dealId, patch: state.patch, expectedVersion: current.version };
    });

  applyMine = (dealId: DealId): UpdateItem | null =>
    this.transact((draft) => {
      const state = draft.saveStates.get(dealId);
      if (state?.status !== SaveStatus.Conflict || !this.get(dealId)) return null;
      draft.saveStates.delete(dealId);
      return this.edit([{ dealId, patch: state.patch }]).send[0] ?? null;
    });

  discard = (dealId: DealId) => {
    this.transact((draft) => {
      const state = draft.saveStates.get(dealId);
      if (!state || state.status === SaveStatus.Saving) return;
      if (state.status === SaveStatus.Failed) this.write(draft, state.before);
      draft.saveStates.delete(dealId);
    });
  };

  applyRemote = (deal: Deal, by: string) => {
    this.transact((draft) => {
      const current = this.get(deal.id);
      if (!current || deal.version <= current.version) return;
      const state = draft.saveStates.get(deal.id);
      if (state?.status === SaveStatus.Saving) return;
      if (state) {
        draft.saveStates.set(deal.id, {
          ...state,
          status: SaveStatus.Conflict,
          theirs: deal,
          message: `${by} changed this deal first`,
        });
      } else {
        draft.remoteMarks.set(deal.id, by);
      }
      this.record(current, deal, by);
      this.write(draft, deal);
    });
  };

  clearRemoteMarks = () => {
    this.transact((draft) => {
      if (draft.remoteMarks.size === 0) return;
      draft.remoteMarks.clear();
    });
  };

  private transact<T>(change: (draft: Draft) => T): T;

  private transact(change: () => void): void;

  private transact(change: (draft: Draft) => unknown): unknown {
    if (this.draft) return change(this.draft);
    const state = this.zustand.getState();
    const draft: Draft = {
      deals: state.deals as Deal[],
      dealsCopied: false,
      saveStates: new Map(state.saveStates),
      remoteMarks: new Map(state.remoteMarks),
    };
    this.draft = draft;
    try {
      return change(draft);
    } finally {
      this.draft = null;
      this.zustand.setState({
        deals: draft.deals,
        saveStates: draft.saveStates,
        remoteMarks: draft.remoteMarks,
      });
    }
  }

  private write = (draft: Draft, deal: Deal) => {
    const index = this.indexById.get(deal.id);
    if (index === undefined) return;
    if (!draft.dealsCopied) {
      draft.deals = draft.deals.slice();
      draft.dealsCopied = true;
    }
    draft.deals[index] = deal;
  };

  private record = (before: Deal, after: Deal, by: string) => {
    const changes: ChangeEntry['changes'][number][] = [];
    if (before.stage !== after.stage)
      changes.push({ field: 'stage', from: before.stage, to: after.stage });
    if (before.ownerId !== after.ownerId)
      changes.push({ field: 'ownerId', from: before.ownerId, to: after.ownerId });
    if (before.valueInr !== after.valueInr)
      changes.push({ field: 'valueInr', from: before.valueInr, to: after.valueInr });
    const list = this.history.get(after.id) ?? [];
    list.push({ at: after.updatedAt, version: after.version, by, changes });
    if (list.length > HISTORY_LIMIT) list.shift();
    this.history.set(after.id, list);
  };
}

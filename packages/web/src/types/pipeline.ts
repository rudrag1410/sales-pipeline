import type { InjectedFailure, StageId } from '@/constants/enums';

import type { SimulationConfig } from './api';
import type { ChangeEntry, Deal, DealId, DealPatch, Owner } from './deal';
import type { SaveState } from './store';
import type { DealResults } from './view';

export interface LoadStatus {
  isLoading: boolean;
  error: string | null;
  rowsError: string | null;
  reload: () => void;
}

export interface SyncSummary {
  online: boolean;
  saving: number;
  failed: number;
  attention: number;
  retryFailed: () => void;
}

export interface PipelineActions {
  moveStage: (dealId: DealId, stage: StageId) => void;
  moveDeals: (dealIds: ReadonlyArray<DealId>, stage: StageId) => void;
  editDeal: (dealId: DealId, patch: DealPatch, label: string) => void;
  retry: (dealId: DealId) => void;
  applyMine: (dealId: DealId) => void;
  discard: (dealId: DealId) => void;
  clearRemoteMarks: () => void;
  selectAllMatching: () => Promise<ReadonlyArray<DealId>>;
}

export interface SimulationControls {
  config: SimulationConfig;
  update: (patch: Partial<SimulationConfig>) => void;
  failNext: (kind: InjectedFailure) => void;
  teammateEdit: (fallbackDealId: DealId | null) => void;
}

export interface SalesPipeline {
  status: LoadStatus;
  results: DealResults;
  requestRange: (start: number, end: number) => void;
  owners: ReadonlyArray<Owner>;
  ownerName: (ownerId: string) => string;
  saveStates: ReadonlyMap<DealId, SaveState>;
  remoteMarks: ReadonlyMap<DealId, string>;
  sync: SyncSummary;
  now: () => number;
  getDeal: (dealId: DealId | null) => Deal | undefined;
  historyOf: (dealId: DealId) => ReadonlyArray<ChangeEntry>;
  actions: PipelineActions;
  simulation: SimulationControls;
}

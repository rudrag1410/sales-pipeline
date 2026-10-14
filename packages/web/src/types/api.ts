import type { ItemErrorKind } from '@/constants/enums';

import type { Deal, DealId, DealPatch } from './deal';

export interface SimulationConfig {
  latencyMinMs: number;
  latencyMaxMs: number;
  failureRate: number;
  online: boolean;
  teammateRate: number;
}

export interface UpdateItem {
  dealId: DealId;
  patch: DealPatch;
  expectedVersion: number;
}

export type ItemResult =
  | { dealId: DealId; ok: true; deal: Deal }
  | { dealId: DealId; ok: false; kind: ItemErrorKind; message: string; current?: Deal };

export interface RemoteChange {
  deal: Deal;
  by: string;
}

export interface SaveSummary {
  saved: number;
  failed: number;
  conflicts: number;
  rejected: number;
  refused: number;
}

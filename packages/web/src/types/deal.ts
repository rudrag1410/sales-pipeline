import type { SortDirection, StageId } from '@/constants/enums';

export type DealId = string;

export type OwnerId = string;

export interface Owner {
  id: OwnerId;
  name: string;
}

export interface Deal {
  id: DealId;
  company: string;
  title: string;
  valueInr: number;
  licences: number;
  stage: StageId;
  ownerId: OwnerId;
  expectedCloseDate: string;
  lastActivityAt: string;
  version: number;
  updatedAt: string;
}

export type DealPatch = Partial<Pick<Deal, 'stage' | 'ownerId' | 'valueInr'>>;

export type PatchField = keyof DealPatch;

export type SortField =
  | 'company'
  | 'title'
  | 'valueInr'
  | 'licences'
  | 'stage'
  | 'ownerId'
  | 'expectedCloseDate'
  | 'lastActivityAt'
  | 'updatedAt';

export interface SortSpec {
  field: SortField;
  direction: SortDirection;
}

export interface DealQuery {
  search: string;
  stages: ReadonlyArray<StageId>;
  ownerIds: ReadonlyArray<OwnerId>;
  valueMin: number | null;
  valueMax: number | null;
  closeFrom: string | null;
  closeTo: string | null;
  closeWithinDays: number | null;
  staleDays: number | null;
  sort: SortSpec;
}

export interface Activity {
  id: string;
  at: string;
  kind: 'call' | 'email' | 'meeting' | 'note';
  summary: string;
}

export interface ChangeEntry {
  at: string;
  version: number;
  by: string;
  changes: ReadonlyArray<{ field: PatchField; from: string | number; to: string | number }>;
}

export interface QueryEvaluation {
  matches: number[];
  byStage: Record<StageId, number>;
  totalValueInr: number;
  staleCount: number;
}

export type RuleViolation = { field: keyof DealPatch; message: string };

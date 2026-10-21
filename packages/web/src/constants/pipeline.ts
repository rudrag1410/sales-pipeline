import type { Deal, SortField } from '@/types/deal';

import { StageId } from './enums';

export { StageId };

export const STAGE_IDS: ReadonlyArray<StageId> = Object.values(StageId);

export const isStageId = (value: unknown): value is StageId =>
  STAGE_IDS.some((stage) => stage === value);

export const STAGE_LABELS: Readonly<Record<StageId, string>> = {
  [StageId.NewLead]: 'New Lead',
  [StageId.Contacted]: 'Contacted',
  [StageId.DemoDone]: 'Demo Done',
  [StageId.ProposalSent]: 'Proposal Sent',
  [StageId.Negotiation]: 'Negotiation',
  [StageId.Won]: 'Won',
  [StageId.Lost]: 'Lost',
};

export const STAGE_ORDER: Readonly<Record<StageId, number>> = {
  [StageId.NewLead]: 0,
  [StageId.Contacted]: 1,
  [StageId.DemoDone]: 2,
  [StageId.ProposalSent]: 3,
  [StageId.Negotiation]: 4,
  [StageId.Won]: 5,
  [StageId.Lost]: 6,
};

export const SORT_KEY_OVERRIDES: Readonly<
  Partial<Record<SortField, (deal: Deal) => string | number>>
> = {
  stage: (deal) => STAGE_ORDER[deal.stage],
};

export const CLOSED_STAGES: ReadonlyArray<StageId> = [StageId.Won, StageId.Lost];
export const OPEN_STAGES: ReadonlyArray<StageId> = STAGE_IDS.filter(
  (s) => !CLOSED_STAGES.includes(s),
);

export const ALLOWED_REOPEN_TARGETS: Readonly<
  Record<StageId.Won | StageId.Lost, ReadonlyArray<StageId>>
> = {
  [StageId.Won]: [StageId.Negotiation],
  [StageId.Lost]: [StageId.NewLead, StageId.Contacted],
};

export const DATASET_SIZE = 50_000;
export const OWNER_COUNT = 20;
export const DEFAULT_SEED = 20_241_014;

export const SEED_REFERENCE_TIME = Date.UTC(2026, 9, 14, 9, 0, 0);

export const MS_PER_DAY = 86_400_000;
export const STALE_DEFAULT_DAYS = 30;
export const CLOSING_SOON_DAYS = 14;

export const ROW_HEIGHT_REM = 2.25;
export const BASE_FONT_PX = 16;
export const SEARCH_DEBOUNCE_MS = 250;

export const CURRENT_OWNER_ID = 'owner-01';

export const FILTER_DEBOUNCE_MS = 300;
export const GRID_DOM_ID = 'deals-grid';
export const DEFAULT_VIEW_ID = 'all';
export const PAGE_SIZES: ReadonlyArray<number> = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 50;

export const EMPTY_STAGE_COUNTS: Readonly<Record<StageId, number>> = {
  [StageId.NewLead]: 0,
  [StageId.Contacted]: 0,
  [StageId.DemoDone]: 0,
  [StageId.ProposalSent]: 0,
  [StageId.Negotiation]: 0,
  [StageId.Won]: 0,
  [StageId.Lost]: 0,
};

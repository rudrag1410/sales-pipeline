import type { SkipReason, StageId } from '@/constants/enums';

import type { Deal, DealQuery, QueryEvaluation, SortField } from './deal';
import type { SaveState } from './store';

export type ColumnId =
  | 'select'
  | 'company'
  | 'title'
  | 'valueInr'
  | 'licences'
  | 'stage'
  | 'ownerId'
  | 'expectedCloseDate'
  | 'lastActivityAt'
  | 'version'
  | 'updatedAt';

export interface ColumnMeta {
  id: ColumnId;
  label: string;
  width: number;
  minWidth: number;
  sortField: SortField | null;
  hideable: boolean;
  align?: 'right';
}

export interface ViewState {
  query: DealQuery;
  hiddenColumns: ReadonlyArray<ColumnId>;
  viewId: string | null;
}

export interface SavedView {
  id: string;
  name: string;
  query: Omit<DealQuery, 'search'>;
  hiddenColumns: ReadonlyArray<ColumnId>;
}

export type Selection = ReadonlySet<string>;

export interface BulkPlan {
  eligible: ReadonlyArray<Deal>;
  skipped: ReadonlyArray<{ deal: Deal; reason: SkipReason; message: string }>;
  skippedByReason: Readonly<Record<SkipReason, number>>;
}

export interface DealResults {
  deals: ReadonlyArray<Deal>;
  matches: ReadonlyArray<number>;
  total: number;
  matchingNow: number;
  totalValueInr: number;
  staleCount: number;
  byStage: QueryEvaluation['byStage'];
}

export interface RowData {
  index: number;
  deal: Deal;
}

export interface RowContextValue {
  deal: Deal;
  saveState: SaveState | undefined;
  remoteBy: string | undefined;
  selected: boolean;
  ownerName: (id: string) => string;
  now: number;
  toggleSelected: () => void;
  moveStage: (stage: StageId) => void;
}

export interface GridKeyboardOptions {
  total: number;
  activeIndex: number | null;
  viewportHeight: () => number | undefined;
  rowHeightPx: number;
  idAt: (index: number) => string | null;
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
  onActiveChange: (index: number) => void;
  scrollToIndex: (index: number) => void;
  onToggle: (id: string) => void;
  onOpenDeal: (id: string) => void;
  onMoveDeal: (id: string) => void;
}

export interface GlobalShortcuts {
  onFocusSearch: () => void;
  onFocusGrid: () => void;
  onShowShortcuts: () => void;
}

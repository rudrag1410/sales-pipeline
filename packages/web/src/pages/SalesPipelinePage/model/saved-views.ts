import { SortDirection } from '@/constants/enums';
import {
  CLOSING_SOON_DAYS,
  CURRENT_OWNER_ID,
  DEFAULT_VIEW_ID,
  OPEN_STAGES,
  STAGE_LABELS,
  STALE_DEFAULT_DAYS,
} from '@/constants/pipeline';
import { createDefaultQuery, DEFAULT_SORT } from '@/data/deal-query';
import type { SavedView } from '@/types/view';

import { COLUMNS, DEFAULT_HIDDEN_COLUMNS } from './columns';

const { search: _search, ...baseQuery } = createDefaultQuery();

const STALE_VIEW: SavedView = {
  id: 'stale',
  name: 'Stale Deals',
  query: {
    ...baseQuery,
    staleDays: STALE_DEFAULT_DAYS,
    stages: OPEN_STAGES,
    sort: { field: 'lastActivityAt', direction: SortDirection.Asc },
  },
  hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
};

export const BUILTIN_VIEWS: ReadonlyArray<SavedView> = [
  {
    id: DEFAULT_VIEW_ID,
    name: 'All Deals',
    query: baseQuery,
    hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
  },
  {
    id: 'attention',
    name: 'Needs attention',
    query: {
      ...baseQuery,
      stages: OPEN_STAGES,
      sort: { field: 'expectedCloseDate', direction: SortDirection.Asc },
    },
    hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
  },
  {
    id: 'mine',
    name: 'My Deals',
    query: { ...baseQuery, ownerIds: [CURRENT_OWNER_ID] },
    hiddenColumns: [...DEFAULT_HIDDEN_COLUMNS, 'ownerId'],
  },
  STALE_VIEW,
  {
    id: 'closing',
    name: 'Closing Soon',
    query: {
      ...baseQuery,
      closeWithinDays: CLOSING_SOON_DAYS,
      stages: OPEN_STAGES,
      sort: { field: 'expectedCloseDate', direction: SortDirection.Asc },
    },
    hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
  },
];

export const describeView = ({ query }: SavedView): string => {
  const parts: string[] = [];
  if (query.stages.length > 0) {
    const isOpen =
      query.stages.length === OPEN_STAGES.length &&
      OPEN_STAGES.every((stage) => query.stages.includes(stage));
    parts.push(isOpen ? 'Open deals' : query.stages.map((stage) => STAGE_LABELS[stage]).join(', '));
  }
  if (query.ownerIds.length > 0) parts.push('Your deals');
  if (query.staleDays !== null) parts.push(`No activity ${query.staleDays}d+`);
  if (query.closeWithinDays !== null) parts.push(`Closing in ${query.closeWithinDays} days`);
  const { sort } = query;
  if (sort.field !== DEFAULT_SORT.field || sort.direction !== DEFAULT_SORT.direction) {
    const label = COLUMNS.find((column) => column.sortField === sort.field)?.label ?? sort.field;
    parts.push(`sorted by ${label} ${sort.direction === SortDirection.Asc ? '↑' : '↓'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Every deal, newest update first';
};

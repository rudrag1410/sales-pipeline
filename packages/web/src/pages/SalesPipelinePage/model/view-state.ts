import {
  createParser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs';

import { SortDirection, StageId } from '@/constants/enums';
import { DEFAULT_VIEW_ID } from '@/constants/pipeline';
import { createDefaultQuery, DEFAULT_SORT } from '@/data/deal-query';
import type { DealQuery, SortField, SortSpec } from '@/types/deal';
import type { ColumnId, ViewState } from '@/types/view';

import { COLUMN_IDS, COLUMNS, DEFAULT_HIDDEN_COLUMNS } from './columns';

const SORT_FIELDS: ReadonlyArray<SortField> = COLUMNS.flatMap((c) =>
  c.sortField ? [c.sortField] : [],
);

const parseAsSort = createParser<SortSpec>({
  parse: (value) => {
    const [field, direction] = value.split(':');
    const sortField = SORT_FIELDS.find((candidate) => candidate === field);
    if (!sortField) return null;
    return {
      field: sortField,
      direction: direction === SortDirection.Asc ? SortDirection.Asc : SortDirection.Desc,
    };
  },
  serialize: (sort) => `${sort.field}:${sort.direction}`,
  eq: (a, b) => a.field === b.field && a.direction === b.direction,
}).withDefault(DEFAULT_SORT);

export const viewParsers = {
  q: parseAsString.withDefault(''),
  stage: parseAsArrayOf(parseAsStringEnum<StageId>(Object.values(StageId))).withDefault([]),
  owner: parseAsArrayOf(parseAsString).withDefault([]),
  vmin: parseAsInteger,
  vmax: parseAsInteger,
  from: parseAsString,
  to: parseAsString,
  within: parseAsInteger,
  stale: parseAsInteger,
  sort: parseAsSort,
  hide: parseAsArrayOf(parseAsStringEnum<ColumnId>([...COLUMN_IDS])).withDefault([
    ...DEFAULT_HIDDEN_COLUMNS,
  ]),
  view: parseAsString,
};

export type ViewParams = {
  [K in keyof typeof viewParsers]: ReturnType<(typeof viewParsers)[K]['parseServerSide']> | null;
};

export const createDefaultViewState = (): ViewState => ({
  query: createDefaultQuery(),
  hiddenColumns: DEFAULT_HIDDEN_COLUMNS,
  viewId: DEFAULT_VIEW_ID,
});

export const hasActiveFilters = (query: DealQuery): boolean =>
  Boolean(
    query.search ||
    query.stages.length ||
    query.ownerIds.length ||
    query.valueMin !== null ||
    query.valueMax !== null ||
    query.closeFrom ||
    query.closeTo ||
    query.closeWithinDays !== null ||
    query.staleDays !== null,
  );

const isDefaultLayout = (query: DealQuery, hidden: ReadonlyArray<ColumnId>): boolean =>
  !hasActiveFilters({ ...query, search: '' }) &&
  query.sort.field === DEFAULT_SORT.field &&
  query.sort.direction === DEFAULT_SORT.direction &&
  [...hidden].sort().join() === [...DEFAULT_HIDDEN_COLUMNS].sort().join();

export const fromParams = (params: ViewParams): ViewState => {
  const query: DealQuery = {
    search: params.q ?? '',
    stages: params.stage ?? [],
    ownerIds: params.owner ?? [],
    valueMin: params.vmin,
    valueMax: params.vmax,
    closeFrom: params.from,
    closeTo: params.to,
    closeWithinDays: params.within,
    staleDays: params.stale,
    sort: params.sort ?? DEFAULT_SORT,
  };
  const hiddenColumns = params.hide ?? DEFAULT_HIDDEN_COLUMNS;
  const viewId = params.view ?? (isDefaultLayout(query, hiddenColumns) ? DEFAULT_VIEW_ID : null);
  return { query, hiddenColumns, viewId };
};

export const toParams = ({ query, hiddenColumns, viewId }: ViewState): ViewParams => ({
  q: query.search || null,
  stage: query.stages.length ? [...query.stages] : null,
  owner: query.ownerIds.length ? [...query.ownerIds] : null,
  vmin: query.valueMin,
  vmax: query.valueMax,
  from: query.closeFrom,
  to: query.closeTo,
  within: query.closeWithinDays,
  stale: query.staleDays,
  sort: query.sort,
  hide: [...hiddenColumns],
  view: viewId && viewId !== DEFAULT_VIEW_ID ? viewId : null,
});

import type { StageId } from '@/constants/enums';
import { SortDirection } from '@/constants/enums';
import { MS_PER_DAY, SORT_KEY_OVERRIDES, STAGE_IDS } from '@/constants/pipeline';
import { isIdle } from '@/data/deal-rules';
import type { Deal, DealQuery, SortField, SortSpec } from '@/types/deal';
import type { QueryEvaluation } from '@/types/deal';

export const DEFAULT_SORT: SortSpec = { field: 'updatedAt', direction: SortDirection.Desc };

export const createDefaultQuery = (): DealQuery => ({
  search: '',
  stages: [],
  ownerIds: [],
  valueMin: null,
  valueMax: null,
  closeFrom: null,
  closeTo: null,
  closeWithinDays: null,
  staleDays: null,
  sort: DEFAULT_SORT,
});

export const searchHaystack = (deal: Deal): string =>
  `${deal.id} ${deal.company} ${deal.title}`.toLowerCase();

const emptyStageCounts = (): Record<StageId, number> =>
  Object.fromEntries(STAGE_IDS.map((stage) => [stage, 0])) as Record<StageId, number>;

export const evaluateQuery = (
  deals: ReadonlyArray<Deal>,
  query: DealQuery,
  now: number,
  haystacks: ReadonlyArray<string>,
): QueryEvaluation => {
  const needle = query.search.trim().toLowerCase();
  const stageFilter = query.stages.length > 0 ? new Set<StageId>(query.stages) : null;
  const ownerFilter = query.ownerIds.length > 0 ? new Set<string>(query.ownerIds) : null;
  const staleCutoff =
    query.staleDays === null ? null : new Date(now - query.staleDays * MS_PER_DAY).toISOString();
  const closeFrom = query.closeFrom;
  const closeTo = query.closeTo;
  const todayIso = new Date(now).toISOString().slice(0, 10);
  const withinIso =
    query.closeWithinDays === null
      ? null
      : new Date(now + query.closeWithinDays * MS_PER_DAY).toISOString().slice(0, 10);

  const result: QueryEvaluation = {
    matches: [],
    byStage: emptyStageCounts(),
    totalValueInr: 0,
    staleCount: 0,
  };

  for (let index = 0; index < deals.length; index++) {
    const deal = deals[index];
    if (!deal) continue;
    if (needle && !haystacks[index]?.includes(needle)) continue;
    if (ownerFilter && !ownerFilter.has(deal.ownerId)) continue;
    if (query.valueMin !== null && deal.valueInr < query.valueMin) continue;
    if (query.valueMax !== null && deal.valueInr > query.valueMax) continue;
    if (closeFrom && deal.expectedCloseDate < closeFrom) continue;
    if (closeTo && deal.expectedCloseDate > closeTo) continue;
    if (
      withinIso !== null &&
      (deal.expectedCloseDate < todayIso || deal.expectedCloseDate > withinIso)
    )
      continue;
    if (staleCutoff !== null && deal.lastActivityAt >= staleCutoff) continue;

    result.byStage[deal.stage]++;
    if (stageFilter && !stageFilter.has(deal.stage)) continue;
    result.matches.push(index);
    result.totalValueInr += deal.valueInr;
    if (isIdle(deal, now)) result.staleCount++;
  }
  return result;
};

const sortKey = (deal: Deal, field: SortField): string | number =>
  SORT_KEY_OVERRIDES[field]?.(deal) ?? deal[field];

export const sortMatches = (
  deals: ReadonlyArray<Deal>,
  matches: number[],
  sort: SortSpec,
): number[] => {
  const direction = sort.direction === SortDirection.Asc ? 1 : -1;
  const { field } = sort;
  return matches.sort((a, b) => {
    const left = deals[a];
    const right = deals[b];
    if (!left || !right) return 0;
    const l = sortKey(left, field);
    const r = sortKey(right, field);
    if (l === r) return 0;
    return (l < r ? -1 : 1) * direction;
  });
};

export const queryCacheKey = (query: DealQuery): string => JSON.stringify(query);

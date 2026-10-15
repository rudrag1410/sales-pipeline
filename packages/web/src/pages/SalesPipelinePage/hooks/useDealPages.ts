import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useStore } from 'zustand';

import { queryCacheKey } from '@/data/deal-query';
import type { ListResponse } from '@/types/api';
import type { DealQuery } from '@/types/deal';
import type { DealResults } from '@/types/view';

import { useDeals, useDealsStore, useFakeApi } from './useDeals';

const PAGE_SIZE = 100;
const PREFETCH_ROWS = 40;

export const SUMMARY_KEY = 'summary';
const PAGES_KEY = 'deal-pages';

interface VisibleRange {
  key: string;
  epoch: number;
  start: number;
  end: number;
}

const pagesCovering = (range: VisibleRange, total: number | undefined): number[] => {
  const lastRow = total === undefined ? range.end + PREFETCH_ROWS : Math.max(0, total - 1);
  const first = Math.floor(Math.max(0, range.start - PREFETCH_ROWS) / PAGE_SIZE);
  const last = Math.floor(Math.min(range.end + PREFETCH_ROWS, lastRow) / PAGE_SIZE);
  const pages = new Set([0]);
  for (let page = first; page <= last; page++) pages.add(page);
  return [...pages];
};

export const useDealPages = (query: DealQuery) => {
  const api = useFakeApi();
  const queryClient = useQueryClient();
  const store = useDealsStore();
  const deals = useDeals();
  const key = queryCacheKey(query);
  const revision = useStore(store.zustand, (state) => state.revision);
  const [range, setRange] = useState<VisibleRange>({ key, epoch: revision, start: 0, end: 0 });
  const visible: VisibleRange =
    range.key === key ? range : { key, epoch: revision, start: 0, end: 0 };
  if (range.key !== key) setRange(visible);
  const knownTotal = queryClient.getQueryData<ListResponse>([
    PAGES_KEY,
    key,
    visible.epoch,
    0,
  ])?.total;

  const pageResults = useQueries({
    queries: pagesCovering(visible, knownTotal).map((page) => ({
      queryKey: [PAGES_KEY, key, visible.epoch, page],
      queryFn: async (): Promise<ListResponse> => {
        const response = await api.list({ query, offset: page * PAGE_SIZE, limit: PAGE_SIZE });
        store.merge(response.items);
        return response;
      },
    })),
  });

  const summary = useQuery({
    queryKey: [SUMMARY_KEY, key],
    queryFn: () => api.summary(query),
    placeholderData: keepPreviousData,
  });

  const pages = new Map<number, ListResponse>();
  for (const result of pageResults) {
    if (result.data) pages.set(Math.floor(result.data.offset / PAGE_SIZE), result.data);
  }
  const first = pageResults[0];

  const results: DealResults = {
    total: pages.get(0)?.total ?? 0,
    dealAt: (index) => {
      const item = pages.get(Math.floor(index / PAGE_SIZE))?.items[index % PAGE_SIZE];
      return item ? (deals.get(item.id) ?? item) : undefined;
    },
    summary: summary.data,
  };

  const failedLater = pageResults.slice(1).find((result) => result.isError);

  return {
    results,
    isLoading: !first || first.isPending,
    error: first?.isError ? first.error.message : null,
    rowsError: failedLater?.isError ? failedLater.error.message : null,
    reload: () => {
      for (const result of pageResults) if (result.isError) void result.refetch();
    },
    requestRange: (start: number, end: number) => {
      setRange((previous) =>
        previous.key === key && previous.start === start && previous.end === end
          ? previous
          : { key, epoch: previous.key === key ? previous.epoch : revision, start, end },
      );
    },
  };
};

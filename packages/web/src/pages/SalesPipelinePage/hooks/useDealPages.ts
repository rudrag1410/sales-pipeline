import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useStore } from 'zustand';

import { queryCacheKey } from '@/data/deal-query';
import type { ListResponse } from '@/types/api';
import type { DealQuery } from '@/types/deal';
import type { PagingInfo } from '@/types/pipeline';
import type { DealResults } from '@/types/view';

import { useDeals, useDealsStore, useFakeApi } from './useDeals';

export const SUMMARY_KEY = 'summary';
const PAGES_KEY = 'deal-pages';

export const useDealPages = (query: DealQuery, requestedPage: number, pageSize: number) => {
  const api = useFakeApi();
  const store = useDealsStore();
  const deals = useDeals();
  const key = queryCacheKey(query);
  const revision = useStore(store.zustand, (state) => state.revision);
  const [cacheEpoch, setCacheEpoch] = useState({ key, epoch: revision });
  const epoch = cacheEpoch.key === key ? cacheEpoch.epoch : revision;
  if (cacheEpoch.key !== key) setCacheEpoch({ key, epoch: revision });

  const summary = useQuery({
    queryKey: [SUMMARY_KEY, key],
    queryFn: () => api.summary(query),
    placeholderData: keepPreviousData,
  });

  const knownTotal = summary.isPlaceholderData ? undefined : summary.data?.total;
  const lastPage =
    knownTotal === undefined ? Infinity : Math.max(1, Math.ceil(knownTotal / pageSize));
  const page = Math.min(requestedPage, lastPage);

  const pageQuery = useQuery({
    queryKey: [PAGES_KEY, key, epoch, pageSize, page],
    queryFn: async (): Promise<ListResponse> => {
      const response = await api.list({ query, offset: (page - 1) * pageSize, limit: pageSize });
      store.merge(response.items);
      return response;
    },
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === key ? previous : undefined,
  });

  const data = pageQuery.data;
  const total = data?.total ?? 0;
  const rowCount = data?.items.length ?? 0;
  const offset = (page - 1) * pageSize;

  const results: DealResults = {
    total,
    rowCount,
    dealAt: (index) => {
      const item = data?.items[index];
      return item ? (deals.get(item.id) ?? item) : undefined;
    },
    summary: summary.data,
  };

  const paging: PagingInfo = {
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total,
    from: rowCount === 0 ? 0 : offset + 1,
    to: offset + rowCount,
    loading: pageQuery.isPlaceholderData,
  };

  return {
    results,
    paging,
    isLoading: pageQuery.isPending,
    error: pageQuery.isError ? pageQuery.error.message : null,
    reload: () => {
      void pageQuery.refetch();
    },
  };
};

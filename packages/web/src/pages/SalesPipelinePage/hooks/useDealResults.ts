import { useMemo } from 'react';
import { useStore } from 'zustand';

import { evaluateQuery, sortMatches } from '@/data/deal-query';
import type { DealsStore } from '@/data/deals-store';
import type { DealQuery } from '@/types/deal';
import type { DealResults } from '@/types/view';

import { useDeals, useDealsStore } from './useDeals';

const computeMatches = (store: DealsStore, query: DealQuery, loaded: boolean) => {
  if (!loaded) return [];
  const current = store.getDeals();
  const evaluation = evaluateQuery(current, query, store.now(), store.haystacks);
  return sortMatches(current, evaluation.matches, query.sort);
};

export const useDealResults = (query: DealQuery): DealResults => {
  const store = useDealsStore();
  const deals = useDeals();
  const loaded = useStore(store.zustand, (state) => state.loaded);

  const matches = useMemo(() => computeMatches(store, query, loaded), [store, query, loaded]);

  const stats = useMemo(
    () => evaluateQuery(deals, query, store.now(), store.haystacks),
    [deals, query, store],
  );

  return {
    deals,
    matches,
    total: matches.length,
    matchingNow: stats.matches.length,
    totalValueInr: stats.totalValueInr,
    staleCount: stats.staleCount,
    byStage: stats.byStage,
  };
};

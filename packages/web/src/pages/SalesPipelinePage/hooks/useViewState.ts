import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { queryCacheKey } from '@/data/deal-query';
import { fromParams, toParams, viewParsers } from '@/pages/SalesPipelinePage/model/view-state';
import type { ViewState } from '@/types/view';

export const useViewState = (): [ViewState, (update: (state: ViewState) => ViewState) => void] => {
  const [params, setParams] = useQueryStates(viewParsers);
  const state = useMemo(() => fromParams(params), [params]);
  const update = (change: (state: ViewState) => ViewState) => {
    void setParams((current) => {
      const before = fromParams(current);
      const after = change(before);
      const resultsChanged =
        queryCacheKey(after.query) !== queryCacheKey(before.query) ||
        after.pageSize !== before.pageSize;
      return toParams(resultsChanged && after.page === before.page ? { ...after, page: 1 } : after);
    });
  };
  return [state, update];
};

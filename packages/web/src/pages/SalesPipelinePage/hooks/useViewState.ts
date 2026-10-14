import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { fromParams, toParams, viewParsers } from '@/pages/SalesPipelinePage/model/view-state';
import type { ViewState } from '@/types/view';

export const useViewState = (): [ViewState, (update: (state: ViewState) => ViewState) => void] => {
  const [params, setParams] = useQueryStates(viewParsers);
  const state = useMemo(() => fromParams(params), [params]);
  const update = (change: (state: ViewState) => ViewState) => {
    void setParams((current) => toParams(change(fromParams(current))));
  };
  return [state, update];
};

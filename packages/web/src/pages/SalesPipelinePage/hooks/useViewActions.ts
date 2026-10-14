import { SortDirection } from '@/constants/enums';
import { createDefaultViewState } from '@/pages/SalesPipelinePage/model/view-state';
import type { DealQuery, SortField } from '@/types/deal';
import type { ColumnId, SavedView, ViewState } from '@/types/view';

type UpdateView = (update: (state: ViewState) => ViewState) => void;

export const useViewActions = (updateView: UpdateView) => ({
  setQuery: (patch: Partial<DealQuery>) => {
    updateView((s) => ({ ...s, viewId: null, query: { ...s.query, ...patch } }));
  },
  setSearch: (search: string) => {
    updateView((s) => (s.query.search === search ? s : { ...s, query: { ...s.query, search } }));
  },
  setHiddenColumns: (hiddenColumns: ReadonlyArray<ColumnId>) => {
    updateView((s) => ({ ...s, viewId: null, hiddenColumns }));
  },
  applyView: (saved: SavedView) => {
    updateView((s) => ({
      ...s,
      viewId: saved.id,
      query: { ...saved.query, search: s.query.search },
      hiddenColumns: saved.hiddenColumns,
    }));
  },
  toggleSort: (field: SortField) => {
    updateView((s) => {
      const ascending =
        s.query.sort.field === field && s.query.sort.direction === SortDirection.Asc;
      return {
        ...s,
        viewId: null,
        query: {
          ...s.query,
          sort: { field, direction: ascending ? SortDirection.Desc : SortDirection.Asc },
        },
      };
    });
  },
  clearFilters: () => {
    updateView((s) => {
      const defaults = createDefaultViewState();
      return {
        ...defaults,
        query: { ...defaults.query, search: s.query.search, sort: s.query.sort },
      };
    });
  },
  resetAll: () => {
    updateView(createDefaultViewState);
  },
});

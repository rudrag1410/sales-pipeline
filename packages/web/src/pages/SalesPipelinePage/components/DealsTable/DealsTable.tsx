import type { ColumnSizingState } from '@tanstack/react-table';
import { useState } from 'react';

import type { StageId } from '@/constants/enums';
import { queryCacheKey } from '@/data/deal-query';
import { DealsGrid } from '@/pages/SalesPipelinePage/components/DealsTable/DealsGrid/DealsGrid';
import { useRootFontSize } from '@/pages/SalesPipelinePage/hooks/useRootFontSize';
import type { DealId, DealQuery, SortField } from '@/types/deal';
import type { SaveState } from '@/types/store';
import type { ColumnId, DealResults, Selection } from '@/types/view';

export interface DealsTableProps {
  query: DealQuery;
  results: DealResults;
  saveStates: ReadonlyMap<DealId, SaveState>;
  remoteMarks: ReadonlyMap<DealId, string>;
  ownerName: (ownerId: string) => string;
  now: () => number;
  hiddenColumns: ReadonlyArray<ColumnId>;
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
  onSortChange: (field: SortField) => void;
  onOpenDeal: (id: string) => void;
  onMoveDeal: (id: string) => void;
  onMoveStage: (id: string, stage: StageId) => void;
  onClearFilters: () => void;
  onRangeChange: (start: number, end: number) => void;
  onSelectAllMatching: () => void;
  selectingAll: boolean;
}

export const DealsTable = (props: DealsTableProps) => {
  const rootFontPx = useRootFontSize();
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  return (
    <DealsGrid
      key={`${queryCacheKey(props.query)}@${rootFontPx}`}
      {...props}
      columnSizing={columnSizing}
      onColumnSizingChange={setColumnSizing}
    />
  );
};

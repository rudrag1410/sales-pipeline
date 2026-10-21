import { useLatestCallback } from '@pipeline/shared';
import type { ColumnSizingState, SortingState, VisibilityState } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { StageId } from '@/constants/enums';
import { SortDirection } from '@/constants/enums';
import { BASE_FONT_PX, GRID_DOM_ID, ROW_HEIGHT_REM } from '@/constants/pipeline';
import { DealRow } from '@/pages/SalesPipelinePage/components/DealsTable/DealRow/DealRow';
import type { DealsTableProps } from '@/pages/SalesPipelinePage/components/DealsTable/DealsTable';
import { GridEmpty } from '@/pages/SalesPipelinePage/components/DealsTable/GridEmpty/GridEmpty';
import { GridHeader } from '@/pages/SalesPipelinePage/components/DealsTable/GridHeader/GridHeader';
import { SelectAllControl } from '@/pages/SalesPipelinePage/components/DealsTable/SelectAllControl/SelectAllControl';
import { TABLE_COLUMNS } from '@/pages/SalesPipelinePage/components/DealsTable/table-columns';
import { useRootFontSize } from '@/pages/SalesPipelinePage/hooks/useRootFontSize';
import { SELECT_COLUMN_ID } from '@/pages/SalesPipelinePage/model/columns';
import { toggleSelected } from '@/pages/SalesPipelinePage/model/selection';
import type { SortField } from '@/types/deal';
import type { RowData } from '@/types/view';

import styles from './DealsGrid.module.css';
import { useGridKeyboard } from './useGridKeyboard';

const OVERSCAN_ROWS = 8;
const MINUTE_MS = 60_000;
const INITIAL_VIEWPORT = { width: 1200, height: 600 };

export interface DealsGridProps extends DealsTableProps {
  columnSizing: ColumnSizingState;
  onColumnSizingChange: (
    updater: ColumnSizingState | ((previous: ColumnSizingState) => ColumnSizingState),
  ) => void;
}

export const DealsGrid = ({
  query,
  results,
  saveStates,
  remoteMarks,
  ownerName,
  now,
  hiddenColumns,
  selection,
  onSelectionChange,
  onSortChange,
  onOpenDeal,
  onMoveDeal,
  onMoveStage,
  onClearFilters,
  onSelectAllMatching,
  selectingAll,
  page,
  pageSize,
  loading,
  columnSizing,
  onColumnSizingChange,
}: DealsGridProps) => {
  const { rowCount, dealAt } = results;
  const pageKey = `${page}:${pageSize}`;
  const rootFontPx = useRootFontSize();
  const scale = rootFontPx / BASE_FONT_PX;
  const rowHeightPx = ROW_HEIGHT_REM * rootFontPx;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activePageKey, setActivePageKey] = useState(pageKey);
  if (activePageKey !== pageKey) {
    setActivePageKey(pageKey);
    setActiveIndex(null);
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeightPx,
    overscan: OVERSCAN_ROWS,
    initialRect: INITIAL_VIEWPORT,
  });
  const items = virtualizer.getVirtualItems();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageKey]);

  const data = items.flatMap((item): RowData[] => {
    const deal = dealAt(item.index);
    return deal ? [{ index: item.index, deal }] : [];
  });

  const sorting = useMemo<SortingState>(
    () => [{ id: query.sort.field, desc: query.sort.direction === SortDirection.Desc }],
    [query.sort],
  );
  const visibility = useMemo<VisibilityState>(
    () => Object.fromEntries(hiddenColumns.map((c) => [c, false])),
    [hiddenColumns],
  );

  const table = useReactTable({
    data,
    columns: TABLE_COLUMNS,
    state: { sorting, columnVisibility: visibility, columnSizing },
    onColumnSizingChange,
    columnResizeMode: 'onChange',
    manualSorting: true,
    autoResetAll: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.deal.id,
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const columnsKey = visibleColumns.map((c) => c.id).join(',');
  const gridStyle = {
    '--cols': visibleColumns
      .map((c) =>
        c.id === SELECT_COLUMN_ID
          ? `${c.getSize() * scale}px`
          : `minmax(${c.getSize() * scale}px, ${c.getSize()}fr)`,
      )
      .join(' '),
    '--total-width': `${table.getTotalSize() * scale}px`,
  } as CSSProperties;

  const rowsByIndex = new Map(table.getRowModel().rows.map((row) => [row.original.index, row]));
  const visibleIds = data.map((row) => row.deal.id);
  const nowMinute = Math.floor(now() / MINUTE_MS) * MINUTE_MS;

  const onToggle = useLatestCallback((id: string) => {
    onSelectionChange(toggleSelected(selection, id));
  });
  const onActivate = useLatestCallback((index: number) => {
    setActiveIndex(index);
  });
  const onMoveStageCallback = useLatestCallback((id: string, stage: StageId) => {
    onMoveStage(id, stage);
  });
  const onOpen = useLatestCallback((id: string) => {
    onOpenDeal(id);
  });

  const onKeyDown = useGridKeyboard({
    total: rowCount,
    activeIndex,
    viewportHeight: () => scrollRef.current?.clientHeight,
    rowHeightPx,
    idAt: (index) => dealAt(index)?.id ?? null,
    selection,
    onSelectionChange,
    onActiveChange: setActiveIndex,
    scrollToIndex: (index) => {
      virtualizer.scrollToIndex(index, { align: 'auto' });
    },
    onToggle,
    onOpenDeal,
    onMoveDeal,
  });

  const resizeBy = (columnId: string, delta: number) => {
    onColumnSizingChange((sizing) => {
      const meta = TABLE_COLUMNS.find((c) => c.id === columnId);
      const current = sizing[columnId] ?? meta?.size ?? 100;
      return { ...sizing, [columnId]: Math.max(meta?.minSize ?? 60, current + delta) };
    });
  };

  return (
    <div className={styles.region}>
      <div
        ref={scrollRef}
        className={styles.scroller}
        style={gridStyle}
        id={GRID_DOM_ID}
        role="grid"
        aria-label="Deals"
        aria-rowcount={rowCount + 1}
        aria-busy={loading}
        data-loading={loading}
        aria-colcount={visibleColumns.length}
        aria-multiselectable="true"
        aria-activedescendant={activeIndex === null ? undefined : `deal-row-${activeIndex}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          if (event.target === event.currentTarget && activeIndex === null && rowCount > 0)
            setActiveIndex(0);
        }}
      >
        <GridHeader
          headers={table.getHeaderGroups()[0]?.headers ?? []}
          onSortChange={(field: SortField) => {
            onSortChange(field);
          }}
          onResizeBy={resizeBy}
          renderSelectControl={() => (
            <SelectAllControl
              total={results.total}
              selection={selection}
              visibleIds={visibleIds}
              selectingAll={selectingAll}
              onSelectAllMatching={onSelectAllMatching}
              onSelectionChange={onSelectionChange}
            />
          )}
        />
        {rowCount === 0 ? (
          <GridEmpty search={query.search} onClearFilters={onClearFilters} />
        ) : (
          <div
            className={styles.body}
            style={{ height: virtualizer.getTotalSize() }}
            role="presentation"
          >
            {items.map((item) => {
              const row = rowsByIndex.get(item.index);
              if (!row) return null;
              return (
                <DealRow
                  key={row.id}
                  row={row}
                  top={item.start}
                  active={item.index === activeIndex}
                  selected={selection.has(row.original.deal.id)}
                  saveState={saveStates.get(row.original.deal.id)}
                  remoteBy={remoteMarks.get(row.original.deal.id)}
                  columnsKey={columnsKey}
                  nowMinute={nowMinute}
                  ownerName={ownerName}
                  onActivate={onActivate}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onMoveStage={onMoveStageCallback}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

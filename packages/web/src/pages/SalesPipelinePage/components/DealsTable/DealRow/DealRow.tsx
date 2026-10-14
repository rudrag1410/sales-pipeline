import { cx } from '@pipeline/shared';
import type { Row } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { memo, useMemo } from 'react';

import type { StageId } from '@/constants/enums';
import { RowContext } from '@/pages/SalesPipelinePage/components/DealsTable/table-columns';
import type { SaveState } from '@/types/store';
import type { ColumnMeta, RowContextValue, RowData } from '@/types/view';

import styles from './DealRow.module.css';

export interface DealRowProps {
  row: Row<RowData>;
  top: number;
  active: boolean;
  selected: boolean;
  saveState: SaveState | undefined;
  remoteBy: string | undefined;
  columnsKey: string;
  nowMinute: number;
  ownerName: (id: string) => string;
  onActivate: (index: number) => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onMoveStage: (id: string, stage: StageId) => void;
}

const DealRowView = ({
  row,
  top,
  active,
  selected,
  saveState,
  remoteBy,
  nowMinute,
  ownerName,
  onActivate,
  onToggle,
  onOpen,
  onMoveStage,
}: DealRowProps) => {
  const { index, deal } = row.original;
  const context = useMemo<RowContextValue>(
    () => ({
      deal,
      saveState,
      remoteBy,
      selected,
      ownerName,
      now: nowMinute,
      toggleSelected: () => {
        onToggle(deal.id);
      },
      moveStage: (stage) => {
        onMoveStage(deal.id, stage);
      },
    }),
    [deal, saveState, remoteBy, selected, ownerName, nowMinute, onToggle, onMoveStage],
  );

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      id={`deal-row-${index}`}
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected}
      tabIndex={-1}
      className={cx(
        styles.row,
        selected && styles.selected,
        active && styles.active,
        saveState && styles[saveState.status],
      )}
      style={{ transform: `translateY(${top}px)` }}
      onClick={() => {
        onActivate(index);
        onOpen(deal.id);
      }}
    >
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as ColumnMeta;
        return (
          <div
            key={cell.id}
            role="gridcell"
            className={cx(styles.cell, meta.align === 'right' && styles.cellRight)}
          >
            <RowContext.Provider value={context}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </RowContext.Provider>
          </div>
        );
      })}
    </div>
  );
};

export const DealRow = memo(
  DealRowView,
  (a, b) =>
    a.row.original.deal === b.row.original.deal &&
    a.row.original.index === b.row.original.index &&
    a.top === b.top &&
    a.active === b.active &&
    a.selected === b.selected &&
    a.saveState === b.saveState &&
    a.remoteBy === b.remoteBy &&
    a.columnsKey === b.columnsKey &&
    a.nowMinute === b.nowMinute &&
    a.ownerName === b.ownerName &&
    a.onActivate === b.onActivate &&
    a.onToggle === b.onToggle &&
    a.onOpen === b.onOpen &&
    a.onMoveStage === b.onMoveStage,
);

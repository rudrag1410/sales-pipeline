import { cx } from '@pipeline/shared';
import type { Header } from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';

import { SortDirection } from '@/constants/enums';
import { SELECT_COLUMN_ID } from '@/pages/SalesPipelinePage/model/columns';
import type { SortField } from '@/types/deal';
import type { ColumnMeta, RowData } from '@/types/view';

import styles from './GridHeader.module.css';

const RESIZE_STEP_PX = 12;

const ariaSort = (sorted: false | 'asc' | 'desc', sortable: boolean) => {
  if (sorted === SortDirection.Asc) return 'ascending';
  if (sorted === SortDirection.Desc) return 'descending';
  return sortable ? 'none' : undefined;
};

export interface GridHeaderProps {
  headers: ReadonlyArray<Header<RowData, unknown>>;
  renderSelectControl: () => ReactNode;
  onSortChange: (field: SortField) => void;
  onResizeBy: (columnId: string, delta: number) => void;
}

export const GridHeader = ({
  headers,
  renderSelectControl,
  onSortChange,
  onResizeBy,
}: GridHeaderProps) => (
  <div className={styles.headerRow} role="row" aria-rowindex={1}>
    {headers.map((header) => {
      const meta = header.column.columnDef.meta as ColumnMeta;
      const sorted = header.column.getIsSorted();
      return (
        <div
          key={header.id}
          role="columnheader"
          aria-sort={ariaSort(sorted, meta.sortField !== null)}
          className={cx(styles.headerCell, meta.align === 'right' && styles.headerCellRight)}
        >
          {meta.id === SELECT_COLUMN_ID ? (
            renderSelectControl()
          ) : meta.sortField ? (
            <button
              type="button"
              className={styles.sortButton}
              onClick={() => {
                if (meta.sortField) onSortChange(meta.sortField);
              }}
            >
              {meta.label}
              {sorted === SortDirection.Asc && <ArrowUp size="0.75rem" aria-hidden="true" />}
              {sorted === SortDirection.Desc && <ArrowDown size="0.75rem" aria-hidden="true" />}
            </button>
          ) : (
            <span>{meta.label}</span>
          )}
          {header.column.getCanResize() && (
            <button
              type="button"
              className={styles.resizer}
              aria-label={`Resize ${meta.label} column`}
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') onResizeBy(header.column.id, -RESIZE_STEP_PX);
                if (event.key === 'ArrowRight') onResizeBy(header.column.id, RESIZE_STEP_PX);
              }}
            />
          )}
        </div>
      );
    })}
  </div>
);

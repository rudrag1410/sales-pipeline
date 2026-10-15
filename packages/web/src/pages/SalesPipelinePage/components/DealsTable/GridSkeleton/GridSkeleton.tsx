import { Skeleton } from '@pipeline/shared';

import { COLUMNS, SELECT_COLUMN_ID } from '@/pages/SalesPipelinePage/model/columns';
import type { ColumnId } from '@/types/view';

import styles from './GridSkeleton.module.css';

const ROW_COUNT = 40;
const MIN_BAR_PERCENT = 45;
const BAR_SPREAD = 40;
const BASE_REM_PX = 16;

export interface GridSkeletonProps {
  hiddenColumns: ReadonlyArray<ColumnId>;
}

const barWidth = (row: number, column: number): string =>
  `${MIN_BAR_PERCENT + ((row * 17 + column * 29) % BAR_SPREAD)}%`;

export const GridSkeleton = ({ hiddenColumns }: GridSkeletonProps) => {
  const columns = COLUMNS.filter((column) => !hiddenColumns.includes(column.id));
  const template = columns
    .map((column) =>
      column.id === SELECT_COLUMN_ID
        ? '2.5rem'
        : `minmax(${column.width / BASE_REM_PX}rem, ${column.width}fr)`,
    )
    .join(' ');

  return (
    <div className={styles.region} role="status" aria-label="Loading deals">
      <div className={styles.header} style={{ gridTemplateColumns: template }}>
        {columns.map((column) => (
          <span
            key={column.id}
            className={column.align === 'right' ? styles.headerRight : styles.headerCell}
          >
            {column.id === SELECT_COLUMN_ID ? '' : column.label}
          </span>
        ))}
      </div>
      {Array.from({ length: ROW_COUNT }, (_, row) => (
        <div key={row} className={styles.row} style={{ gridTemplateColumns: template }}>
          {columns.map((column, index) => (
            <span
              key={column.id}
              className={column.align === 'right' ? styles.cellRight : styles.cell}
            >
              <Skeleton
                width={
                  column.id === SELECT_COLUMN_ID
                    ? '1rem'
                    : column.id === 'stage'
                      ? '4.5rem'
                      : barWidth(row, index)
                }
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

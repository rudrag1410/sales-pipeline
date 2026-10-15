import { Skeleton } from '@pipeline/shared';

import type { ColumnId } from '@/types/view';

import styles from './RowSkeleton.module.css';

const MIN_BAR_PERCENT = 45;
const BAR_SPREAD = 40;

export interface RowSkeletonProps {
  index: number;
  top: number;
  columnIds: ReadonlyArray<ColumnId>;
}

const widthFor = (id: ColumnId, row: number, column: number): string => {
  if (id === 'select') return '1rem';
  if (id === 'stage') return '4.5rem';
  return `${MIN_BAR_PERCENT + ((row * 17 + column * 29) % BAR_SPREAD)}%`;
};

export const RowSkeleton = ({ index, top, columnIds }: RowSkeletonProps) => (
  <div
    id={`deal-row-${index}`}
    role="row"
    aria-rowindex={index + 2}
    aria-busy="true"
    className={styles.row}
    style={{ transform: `translateY(${top}px)` }}
  >
    {columnIds.map((id, column) => (
      <div key={id} role="gridcell" className={styles.cell}>
        <Skeleton width={widthFor(id, index, column)} />
      </div>
    ))}
  </div>
);

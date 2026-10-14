import { Skeleton } from '@pipeline/shared';

import { COLUMNS } from '@/pages/SalesPipelinePage/model/columns';

import styles from './GridSkeleton.module.css';

const ROW_COUNT = 14;

export const GridSkeleton = () => (
  <div className={styles.region} role="status" aria-label="Loading deals">
    <div className={styles.row}>
      {COLUMNS.map((column) => (
        <Skeleton key={column.id} width={column.id === 'select' ? '1rem' : '50%'} />
      ))}
    </div>
    {Array.from({ length: ROW_COUNT }, (_, index) => (
      <div key={index} className={styles.row}>
        {COLUMNS.map((column) => (
          <Skeleton key={column.id} width={column.id === 'select' ? '1rem' : '70%'} />
        ))}
      </div>
    ))}
  </div>
);

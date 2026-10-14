import { Button } from '@pipeline/shared';
import { SearchX } from 'lucide-react';

import styles from './GridEmpty.module.css';

export interface GridEmptyProps {
  search: string;
  onClearFilters: () => void;
}

export const GridEmpty = ({ search, onClearFilters }: GridEmptyProps) => (
  <div className={styles.state} role="status">
    <span className={styles.icon} aria-hidden="true">
      <SearchX size="1.5rem" />
    </span>
    <strong className={styles.title}>
      {search ? `No deals match “${search}”` : 'No deals match these filters'}
    </strong>
    <p className={styles.hint}>Try a different search, or remove some filters to see more deals.</p>
    <Button variant="primary" onClick={onClearFilters}>
      Clear filters
    </Button>
  </div>
);

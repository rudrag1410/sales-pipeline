import { cx } from '@pipeline/shared';
import { ChevronDown, X } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

import styles from './FilterChip.module.css';

export interface FilterChipProps {
  label: string;
  summary: string | null;
  icon?: ReactNode;
  onClear: () => void;
  triggerProps: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> & {
    ref?: Ref<HTMLButtonElement>;
  };
}

export const FilterChip = ({ label, summary, icon, onClear, triggerProps }: FilterChipProps) => {
  const active = summary !== null;
  return (
    <span className={cx(styles.chip, active && styles.active)}>
      <button type="button" className={styles.trigger} {...triggerProps}>
        {icon}
        <span>{label}</span>
        {active ? (
          <span className={styles.summary}>{summary}</span>
        ) : (
          <ChevronDown size="0.75rem" aria-hidden="true" />
        )}
      </button>
      {active && (
        <button
          type="button"
          className={styles.clear}
          aria-label={`Clear ${label} filter`}
          onClick={onClear}
        >
          <X size="0.75rem" aria-hidden="true" />
        </button>
      )}
    </span>
  );
};

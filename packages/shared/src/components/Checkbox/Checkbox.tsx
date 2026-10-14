import type { InputHTMLAttributes } from 'react';

import { cx } from '../../utils/cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = ({ label, indeterminate, className, ...rest }: CheckboxProps) => {
  const setIndeterminate = (element: HTMLInputElement | null) => {
    if (element) element.indeterminate = Boolean(indeterminate);
  };
  const input = (
    <input
      ref={setIndeterminate}
      type="checkbox"
      className={cx(styles.checkbox, className)}
      {...rest}
    />
  );
  return label ? (
    <label className={styles.label}>
      {input}
      {label}
    </label>
  ) : (
    input
  );
};

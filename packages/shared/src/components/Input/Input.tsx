import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { useId } from 'react';

import { cx } from '../../utils/cx';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export const Input = ({ label, icon, error, className, id, ref, ...rest }: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className={styles.field}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <span className={styles.wrap}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cx(styles.input, Boolean(icon) && styles.hasIcon, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
      </span>
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
};

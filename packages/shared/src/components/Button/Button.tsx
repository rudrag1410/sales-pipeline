import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

import { cx } from '../../utils/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'secondary' | 'primary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export const Button = ({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  type = 'button',
  children,
  ref,
  ...rest
}: ButtonProps) => (
  <button
    ref={ref}
    type={type}
    className={cx(styles.button, styles[variant], size === 'sm' && styles.sm, className)}
    {...rest}
  >
    {icon}
    {children}
  </button>
);

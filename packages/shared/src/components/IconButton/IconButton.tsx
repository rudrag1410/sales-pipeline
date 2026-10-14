import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../../utils/cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  icon: ReactNode;
  size?: 'sm' | 'md';
  active?: boolean;
}

export const IconButton = ({
  icon,
  size = 'md',
  active,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) => (
  <button
    type={type}
    className={cx(
      styles.iconButton,
      size === 'sm' && styles.sm,
      active && styles.active,
      className,
    )}
    {...rest}
  >
    {icon}
  </button>
);

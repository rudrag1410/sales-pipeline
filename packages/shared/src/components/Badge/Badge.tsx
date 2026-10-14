import type { HTMLAttributes } from 'react';

import { cx } from '../../utils/cx';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const Badge = ({ tone = 'neutral', className, ...rest }: BadgeProps) => (
  <span className={cx(styles.badge, tone !== 'neutral' && styles[tone], className)} {...rest} />
);

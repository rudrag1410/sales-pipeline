import type { ReactNode } from 'react';

import styles from './VisuallyHidden.module.css';

export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span className={styles.hidden}>{children}</span>
);

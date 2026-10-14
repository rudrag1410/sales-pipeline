import type { CSSProperties } from 'react';

import styles from './Skeleton.module.css';

export const Skeleton = ({ width }: { width?: number | string }) => (
  <span
    className={styles.skeleton}
    aria-hidden="true"
    style={width === undefined ? undefined : ({ width } satisfies CSSProperties)}
  />
);

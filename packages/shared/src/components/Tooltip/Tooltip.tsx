import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: string;
  children: ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      role="presentation"
      className={styles.root}
      aria-describedby={open ? id : undefined}
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
      onFocus={() => {
        setOpen(true);
      }}
      onBlur={() => {
        setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      {children}
      {open && (
        <span role="tooltip" id={id} className={styles.tip}>
          {content}
        </span>
      )}
    </span>
  );
};

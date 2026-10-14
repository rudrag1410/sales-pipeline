import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { createPortal } from 'react-dom';

import { useFocusScope } from '../../hooks/useFocusScope';
import { IconButton } from '../IconButton/IconButton';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'modal' | 'drawer';
}

export const Dialog = ({
  open,
  onClose,
  title,
  children,
  footer,
  variant = 'modal',
}: DialogProps) => {
  const titleId = useId();
  const isModal = variant === 'modal';
  const { ref: focusRef, onKeyDown: onScopeKeyDown } = useFocusScope({
    trap: isModal,
    onEscape: onClose,
  });
  if (!open) return null;

  const panel = (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={focusRef}
      onKeyDown={onScopeKeyDown}
      role="dialog"
      aria-modal={isModal}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={isModal ? styles.dialog : styles.drawer}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <IconButton aria-label="Close" icon={<X size="1rem" />} onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );

  return createPortal(
    isModal ? (
      <div
        role="presentation"
        className={styles.backdrop}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {panel}
      </div>
    ) : (
      <>
        <div role="presentation" className={styles.drawerBackdrop} onMouseDown={onClose} />
        {panel}
      </>
    ),
    document.body,
  );
};

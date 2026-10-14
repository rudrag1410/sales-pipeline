import type { KeyboardEvent, ReactNode } from 'react';
import { useCallback, useId, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './Popover.module.css';

export interface PopoverTriggerProps {
  ref: (element: HTMLButtonElement | null) => void;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: () => void;
}

export interface PopoverProps {
  label: string;
  renderTrigger: (triggerProps: PopoverTriggerProps) => ReactNode;
  children: ReactNode;
}

const MARGIN = 8;
const GAP = 4;

export const Popover = ({ label, renderTrigger, children }: PopoverProps) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const panelId = useId();

  const openPanel = () => {
    const rect = trigger?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + GAP, left: rect.left });
    setOpen(true);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) trigger?.focus();
  };

  const mountPanel = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.right > window.innerWidth - MARGIN) {
      element.style.left = `${Math.max(MARGIN, window.innerWidth - rect.width - MARGIN)}px`;
    }
    if (rect.bottom > window.innerHeight - MARGIN) {
      element.style.top = `${Math.max(MARGIN, window.innerHeight - rect.height - MARGIN)}px`;
    }
    element.querySelector<HTMLElement>('input, button, select, [tabindex]')?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };

  return (
    <>
      {renderTrigger({
        ref: setTrigger,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': open ? panelId : undefined,
        onClick: () => {
          if (open) close(true);
          else openPanel();
        },
      })}
      {open &&
        createPortal(
          <>
            <div
              className={styles.backdrop}
              role="presentation"
              onPointerDown={() => {
                close(false);
              }}
            />
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
              id={panelId}
              ref={mountPanel}
              role="dialog"
              aria-label={label}
              className={styles.panel}
              style={{ top: position.top, left: position.left }}
              onKeyDown={onKeyDown}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

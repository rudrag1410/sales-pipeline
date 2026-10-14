import type { KeyboardEvent, ReactNode } from 'react';
import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cx } from '../../utils/cx';
import styles from './Dropdown.module.css';
import { MENU_KEY_ACTIONS } from './menu-keys';

export interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
  icon?: ReactNode;

  checked?: boolean;
}

export interface DropdownProps {
  items: ReadonlyArray<DropdownItem>;

  renderTrigger: (triggerProps: DropdownTriggerProps) => ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export interface DropdownTriggerProps {
  ref: (element: HTMLButtonElement | null) => void;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export const Dropdown = ({ items, renderTrigger, onOpenChange }: DropdownProps) => {
  const [open, setOpenState] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  const openMenu = () => {
    const rect = trigger?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) trigger?.focus();
  };

  const mountMenu = useCallback(
    (element: HTMLDivElement | null) => {
      menuRef.current = element;
      if (element) {
        const rect = element.getBoundingClientRect();
        const margin = 8;
        if (rect.bottom > window.innerHeight - margin) {
          const above = (trigger?.getBoundingClientRect().top ?? rect.top) - rect.height - 4;
          const clamped = window.innerHeight - rect.height - margin;
          element.style.top = `${Math.max(margin, above >= margin ? above : clamped)}px`;
        }
        if (rect.right > window.innerWidth - margin) {
          element.style.left = `${Math.max(margin, window.innerWidth - rect.width - margin)}px`;
        }
      }
      element?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
    },
    [trigger],
  );

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entries = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? [],
    );
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const focusAt = (next: number) => entries[(next + entries.length) % entries.length]?.focus();
    MENU_KEY_ACTIONS[event.key]?.(event, {
      index,
      count: entries.length,
      focusAt,
      close,
    });
  };

  const triggerProps: DropdownTriggerProps = {
    ref: setTrigger,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: () => {
      if (open) close(true);
      else openMenu();
    },
    onKeyDown: (event) => {
      if (event.key === 'ArrowDown' && !open) {
        event.preventDefault();
        openMenu();
      }
    },
  };

  return (
    <>
      {renderTrigger(triggerProps)}
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
            <div
              ref={mountMenu}
              id={menuId}
              role="menu"
              tabIndex={-1}
              className={styles.menu}
              style={position}
              onKeyDown={onMenuKeyDown}
            >
              {items.map((item) => (
                <div key={item.id} role="none">
                  {item.separatorBefore && <div className={styles.separator} role="separator" />}
                  <button
                    type="button"
                    role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
                    aria-checked={item.checked}
                    disabled={item.disabled}
                    className={cx(styles.item, item.danger && styles.danger)}
                    onClick={() => {
                      if (item.checked === undefined) close(true);
                      item.onSelect();
                    }}
                  >
                    {item.checked !== undefined && (
                      <span className={styles.check} aria-hidden="true">
                        {item.checked ? '✓' : ''}
                      </span>
                    )}
                    {item.icon}
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

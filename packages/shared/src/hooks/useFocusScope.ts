import type { KeyboardEvent } from 'react';
import { useCallback, useState } from 'react';

import { useLatestCallback } from './useLatestCallback';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FocusScopeOptions {
  trap: boolean;
  onEscape: () => void;
}

export const useFocusScope = ({ trap, onEscape }: FocusScopeOptions) => {
  const escape = useLatestCallback(onEscape);
  const [previouslyFocused] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  const ref = useCallback(
    (container: HTMLElement | null) => {
      if (!container) return;
      (container.querySelector<HTMLElement>('[data-autofocus]') ?? container).focus();
      return () => {
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
      };
    },
    [previouslyFocused],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      escape();
      return;
    }
    const container = event.currentTarget;
    if (!trap || event.key !== 'Tab') return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { ref, onKeyDown };
};

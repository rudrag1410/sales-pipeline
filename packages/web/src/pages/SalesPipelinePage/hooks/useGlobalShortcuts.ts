import { useEffect } from 'react';

import type { GlobalShortcuts } from '@/types/view';

const SEARCH_KEY = '/';
const COMMAND_PALETTE_KEY = 'k';
const HELP_KEY = '?';
const GRID_KEY = 'g';
const PREVIOUS_PAGE_KEY = '[';
const NEXT_PAGE_KEY = ']';

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const useGlobalShortcuts = ({
  onPreviousPage,
  onNextPage,
  onFocusSearch,
  onFocusGrid,
  onShowShortcuts,
}: GlobalShortcuts) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === COMMAND_PALETTE_KEY) {
        event.preventDefault();
        onFocusSearch();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const actions: Record<string, () => void> = {
        [SEARCH_KEY]: onFocusSearch,
        [GRID_KEY]: onFocusGrid,
        [HELP_KEY]: onShowShortcuts,
        [PREVIOUS_PAGE_KEY]: onPreviousPage,
        [NEXT_PAGE_KEY]: onNextPage,
      };
      const action = actions[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onFocusSearch, onFocusGrid, onShowShortcuts, onPreviousPage, onNextPage]);
};

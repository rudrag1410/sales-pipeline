import type { KeyboardEvent } from 'react';

import { addSelected, EMPTY_SELECTION } from '@/pages/SalesPipelinePage/model/selection';
import type { GridKeyboardOptions } from '@/types/view';

const DEFAULT_VIEWPORT_PX = 600;
const MOVE_KEY = 'm';
const TOGGLE_KEY = 'x';

export const useGridKeyboard = ({
  total,
  activeIndex,
  viewportHeight,
  rowHeightPx,
  idAt,
  selection,
  onSelectionChange,
  onActiveChange,
  scrollToIndex,
  onToggle,
  onOpenDeal,
  onMoveDeal,
}: GridKeyboardOptions) => {
  const moveActive = (next: number, extendSelection: boolean) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (extendSelection) {
      const ids = [activeIndex ?? clamped, clamped].flatMap((index) => {
        const id = idAt(index);
        return id ? [id] : [];
      });
      onSelectionChange(addSelected(selection, ids));
    }
    onActiveChange(clamped);
    scrollToIndex(clamped);
  };

  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const current = activeIndex ?? -1;
    const pageStep = Math.max(
      1,
      Math.floor((viewportHeight() ?? DEFAULT_VIEWPORT_PX) / rowHeightPx) - 1,
    );
    const activeId = activeIndex === null ? null : idAt(activeIndex);
    const navigation: Record<string, () => void> = {
      ArrowDown: () => {
        moveActive(current + 1, event.shiftKey);
      },
      ArrowUp: () => {
        moveActive(Math.max(0, current - 1), event.shiftKey);
      },
      PageDown: () => {
        moveActive(current + pageStep, false);
      },
      PageUp: () => {
        moveActive(current - pageStep, false);
      },
      Home: () => {
        moveActive(0, false);
      },
      End: () => {
        moveActive(total - 1, false);
      },
    };
    const navigate = navigation[event.key];
    if (navigate) {
      event.preventDefault();
      navigate();
      return;
    }
    if (event.key === ' ' || event.key.toLowerCase() === TOGGLE_KEY) {
      event.preventDefault();
      if (activeId) onToggle(activeId);
    } else if (event.key === 'Enter' && activeId) {
      event.preventDefault();
      onOpenDeal(activeId);
    } else if (
      event.key === MOVE_KEY &&
      activeId &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      onMoveDeal(activeId);
    } else if (event.key === 'Escape' && selection.size > 0) {
      event.preventDefault();
      onSelectionChange(EMPTY_SELECTION);
    }
  };
};

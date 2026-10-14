import type { KeyboardEvent } from 'react';

export interface MenuKeyContext {
  index: number;
  count: number;
  focusAt: (index: number) => void;
  close: (restoreFocus: boolean) => void;
}

type MenuKeyAction = (event: KeyboardEvent, context: MenuKeyContext) => void;

const moveFocus =
  (target: (context: MenuKeyContext) => number): MenuKeyAction =>
  (event, context) => {
    event.preventDefault();
    context.focusAt(target(context));
  };

export const MENU_KEY_ACTIONS: Readonly<Record<string, MenuKeyAction>> = {
  ArrowDown: moveFocus(({ index }) => index + 1),
  ArrowUp: moveFocus(({ index }) => index - 1),
  Home: moveFocus(() => 0),
  End: moveFocus(({ count }) => count - 1),
  Escape: (event, { close }) => {
    event.preventDefault();
    event.stopPropagation();
    close(true);
  },
  Tab: (_event, { close }) => {
    close(false);
  },
};

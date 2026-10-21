import { Dialog } from '@pipeline/shared';

import { MODIFIER_KEY_LABEL } from '@/utils/platform';

import styles from './ShortcutsDialog.module.css';

interface ShortcutGroup {
  title: string;
  shortcuts: ReadonlyArray<readonly [string, string]>;
}

export const SHORTCUT_GROUPS: ReadonlyArray<ShortcutGroup> = [
  {
    title: 'Anywhere',
    shortcuts: [
      [`${MODIFIER_KEY_LABEL} K`, 'Focus search (works while typing)'],
      ['/', 'Focus search'],
      ['G', 'Jump to the deals table'],
      ['[ ]', 'Previous or next page'],
      ['?', 'Show this list'],
      ['Esc', 'Close dialog, drawer or menu'],
      ['Tab / Shift Tab', 'Move between controls (a skip link jumps to the table)'],
    ],
  },
  {
    title: 'Search box',
    shortcuts: [
      ['↓ or Enter', 'Move into the table'],
      ['Esc', 'Clear the text, then leave the box'],
    ],
  },
  {
    title: 'Deals table',
    shortcuts: [
      ['↑ ↓', 'Move the active row'],
      ['PgUp PgDn', 'Move one screen'],
      ['Home End', 'Jump to the first or last row on the page'],
      ['Space or X', 'Select or deselect the active row'],
      ['Shift ↑ ↓', 'Extend the selection while moving'],
      ['Enter', 'Open the active deal'],
      ['M', 'Move the active deal to another stage'],
      ['Esc', 'Clear the selection'],
    ],
  },
  {
    title: 'Menus and lists',
    shortcuts: [
      ['↑ ↓ Home End', 'Move through menu items'],
      ['Enter or Space', 'Choose the highlighted item'],
      ['Type', 'Filter long lists such as owners'],
    ],
  },
];

export const ShortcutsDialog = ({ onClose }: { onClose: () => void }) => (
  <Dialog open title="Keyboard shortcuts" onClose={onClose}>
    {SHORTCUT_GROUPS.map((group) => (
      <section key={group.title} className={styles.shortcutGroup}>
        <h3 className={styles.shortcutTitle}>{group.title}</h3>
        <dl className={styles.keys}>
          {group.shortcuts.map(([keys, description]) => (
            <div key={keys} className={styles.contents}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>
    ))}
  </Dialog>
);

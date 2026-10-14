import { cx, Tooltip } from '@pipeline/shared';

import { describeView } from '@/pages/SalesPipelinePage/model/saved-views';
import type { SavedView } from '@/types/view';

import styles from './SavedViewsBar.module.css';

export interface SavedViewsBarProps {
  views: ReadonlyArray<SavedView>;
  activeId: string | null;
  onSelect: (view: SavedView) => void;
}

export const SavedViewsBar = ({ views, activeId, onSelect }: SavedViewsBarProps) => (
  <div className={styles.chips} role="group" aria-label="Saved views">
    {views.map((view) => (
      <Tooltip key={view.id} content={describeView(view)}>
        <button
          type="button"
          className={cx(styles.chip, view.id === activeId && styles.chipActive)}
          aria-pressed={view.id === activeId}
          onClick={() => {
            onSelect(view);
          }}
        >
          {view.name}
        </button>
      </Tooltip>
    ))}
  </div>
);

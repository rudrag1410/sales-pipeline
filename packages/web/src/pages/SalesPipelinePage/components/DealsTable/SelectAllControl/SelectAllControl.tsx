import { Checkbox, Dropdown } from '@pipeline/shared';
import { ChevronDown } from 'lucide-react';

import {
  addSelected,
  EMPTY_SELECTION,
  removeSelected,
} from '@/pages/SalesPipelinePage/model/selection';
import type { Selection } from '@/types/view';

import styles from './SelectAllControl.module.css';

export interface SelectAllControlProps {
  total: number;
  selection: Selection;
  visibleIds: ReadonlyArray<string>;
  allIds: () => string[];
  onSelectionChange: (selection: Selection) => void;
}

export const SelectAllControl = ({
  total,
  selection,
  visibleIds,
  allIds,
  onSelectionChange,
}: SelectAllControlProps) => {
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selection.has(id));

  return (
    <span className={styles.selectHeader}>
      <Checkbox
        aria-label="Select visible rows"
        checked={allVisibleSelected}
        indeterminate={selection.size > 0 && !allVisibleSelected}
        onChange={() => {
          onSelectionChange(
            allVisibleSelected
              ? removeSelected(selection, visibleIds)
              : addSelected(selection, visibleIds),
          );
        }}
      />
      <Dropdown
        items={[
          {
            id: 'visible',
            label: `Visible rows (${visibleIds.length})`,
            onSelect: () => {
              onSelectionChange(addSelected(selection, visibleIds));
            },
          },
          {
            id: 'all',
            label: `All ${total.toLocaleString('en-IN')} matching deals`,
            disabled: total === 0,
            onSelect: () => {
              onSelectionChange(addSelected(selection, allIds()));
            },
          },
          {
            id: 'clear',
            label: 'Clear selection',
            separatorBefore: true,
            onSelect: () => {
              onSelectionChange(EMPTY_SELECTION);
            },
          },
        ]}
        renderTrigger={(props) => (
          <button
            type="button"
            className={styles.sortButton}
            aria-label="Selection options"
            {...props}
          >
            <ChevronDown size="0.75rem" aria-hidden="true" />
          </button>
        )}
      />
    </span>
  );
};

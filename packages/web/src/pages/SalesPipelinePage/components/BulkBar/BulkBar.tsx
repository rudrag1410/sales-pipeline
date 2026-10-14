import { Button } from '@pipeline/shared';

import { StageId } from '@/constants/enums';
import { STAGE_LABELS } from '@/constants/pipeline';
import { addSelected, EMPTY_SELECTION } from '@/pages/SalesPipelinePage/model/selection';
import type { Selection } from '@/types/view';

import styles from './BulkBar.module.css';

export interface BulkBarProps {
  selection: Selection;
  total: number;
  allIds: () => string[];
  onSelectionChange: (selection: Selection) => void;
  onChangeStage: (stage: StageId) => void;
}

export const BulkBar = ({
  selection,
  total,
  allIds,
  onSelectionChange,
  onChangeStage,
}: BulkBarProps) => (
  <div className={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
    <strong role="status">{selection.size.toLocaleString('en-IN')} selected</strong>
    {selection.size < total && (
      <Button
        size="sm"
        onClick={() => {
          onSelectionChange(addSelected(selection, allIds()));
        }}
      >
        Select all {total.toLocaleString('en-IN')} matching
      </Button>
    )}
    <span className={styles.spacer} />
    <Button
      size="sm"
      onClick={() => {
        onChangeStage(StageId.Contacted);
      }}
    >
      Change stage…
    </Button>
    <Button
      size="sm"
      variant="danger"
      onClick={() => {
        onChangeStage(StageId.Lost);
      }}
    >
      Mark as {STAGE_LABELS[StageId.Lost]}…
    </Button>
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        onSelectionChange(EMPTY_SELECTION);
      }}
    >
      Clear selection
    </Button>
  </div>
);

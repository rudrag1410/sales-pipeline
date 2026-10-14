import { Button, Checkbox, Dialog, Select } from '@pipeline/shared';
import { useMemo, useState } from 'react';

import { StageId } from '@/constants/enums';
import { STAGE_IDS, STAGE_LABELS } from '@/constants/pipeline';
import { planStageChange } from '@/pages/SalesPipelinePage/model/bulk-plan';
import type { Deal, DealId } from '@/types/deal';
import type { SaveState } from '@/types/store';

import styles from './BulkStageDialog.module.css';

const LARGE_BULK_THRESHOLD = 100;

export interface BulkStageDialogProps {
  deals: ReadonlyArray<Deal>;
  saveStates: ReadonlyMap<DealId, SaveState>;
  initialStage: StageId;
  onApply: (dealIds: ReadonlyArray<DealId>, stage: StageId) => void;
  onClose: () => void;
}

export const BulkStageDialog = ({
  deals,
  saveStates,
  initialStage,
  onApply,
  onClose,
}: BulkStageDialogProps) => {
  const [target, setTarget] = useState<StageId>(initialStage);
  const [confirmed, setConfirmed] = useState(false);

  const plan = useMemo(
    () => planStageChange(deals, target, saveStates),
    [deals, saveStates, target],
  );

  const count = plan.eligible.length;
  const needsConfirm = count >= LARGE_BULK_THRESHOLD || target === StageId.Lost;
  const canApply = count > 0 && (!needsConfirm || confirmed);

  const apply = () => {
    onApply(
      plan.eligible.map((deal) => deal.id),
      target,
    );
  };

  return (
    <Dialog
      open
      title="Change stage for selected deals"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant={target === StageId.Lost ? 'danger' : 'primary'}
            disabled={!canApply}
            onClick={apply}
          >
            Apply to {count.toLocaleString('en-IN')} deals
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        <p className={styles.tight}>
          <strong>Selected:</strong> {deals.length.toLocaleString('en-IN')} deals
        </p>
        <Select
          label="Move to stage"
          focusOnMount
          value={target}
          onChange={(value) => {
            setTarget(value);
            setConfirmed(false);
          }}
          options={STAGE_IDS.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] }))}
        />
        <div role="status">
          <p className={styles.tight}>
            <strong>{count.toLocaleString('en-IN')}</strong> will change.
          </p>
          {plan.skipped.length > 0 && (
            <p className={styles.tight}>
              {plan.skipped.length.toLocaleString('en-IN')} will be skipped
              {plan.skippedByReason.already_in_stage > 0 &&
                ` (${plan.skippedByReason.already_in_stage.toLocaleString('en-IN')} already in this stage)`}
              {plan.skippedByReason.busy > 0 &&
                ` (${plan.skippedByReason.busy.toLocaleString('en-IN')} still saving)`}
              {plan.skippedByReason.invalid_transition > 0 &&
                ` (${plan.skippedByReason.invalid_transition.toLocaleString('en-IN')} closed deals that cannot make this move)`}
              .
            </p>
          )}
        </div>
        {needsConfirm && count > 0 && (
          <Checkbox
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
            }}
            label={`I understand this will change ${count.toLocaleString('en-IN')} deals to ${STAGE_LABELS[target]}`}
          />
        )}
      </div>
    </Dialog>
  );
};

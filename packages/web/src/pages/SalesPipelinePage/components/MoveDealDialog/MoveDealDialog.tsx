import { Button, Dialog, Select } from '@pipeline/shared';
import { useState } from 'react';

import type { StageId } from '@/constants/enums';
import { STAGE_IDS, STAGE_LABELS } from '@/constants/pipeline';
import { canTransition } from '@/data/deal-rules';
import type { Deal } from '@/types/deal';

export interface MoveDealDialogProps {
  deal: Deal | undefined;
  onMove: (stage: StageId) => void;
  onClose: () => void;
}

export const MoveDealDialog = ({ deal, onMove, onClose }: MoveDealDialogProps) => {
  const [target, setTarget] = useState<StageId | null>(null);
  if (!deal) return null;
  const stage = target ?? deal.stage;
  const submit = () => {
    if (stage !== deal.stage) onMove(stage);
    onClose();
  };
  return (
    <Dialog
      open
      title={`Move ${deal.company}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={stage === deal.stage} onClick={submit}>
            Move deal
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Select
          label="New stage"
          focusOnMount
          value={stage}
          onChange={setTarget}
          options={STAGE_IDS.map((option) => ({
            value: option,
            label: STAGE_LABELS[option],
            disabled: !canTransition(deal.stage, option),
          }))}
        />
      </form>
    </Dialog>
  );
};

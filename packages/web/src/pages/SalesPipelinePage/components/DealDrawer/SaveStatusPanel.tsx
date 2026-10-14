import { Badge, Button } from '@pipeline/shared';

import { SaveStatus } from '@/constants/enums';
import { isStageId, STAGE_LABELS } from '@/constants/pipeline';
import type { Deal, PatchField } from '@/types/deal';
import type { SaveState } from '@/types/store';
import { formatInr } from '@/utils/format';

import styles from './DealDrawer.module.css';

const FIELD_LABELS: Readonly<Record<PatchField, string>> = {
  stage: 'Stage',
  ownerId: 'Owner',
  valueInr: 'Value',
};

export interface SaveStatusPanelProps {
  state: SaveState;
  ownerName: (ownerId: string) => string;
  onRetry: () => void;
  onApplyMine: () => void;
  onDiscard: () => void;
}

export const SaveStatusPanel = ({
  state,
  ownerName,
  onRetry,
  onApplyMine,
  onDiscard,
}: SaveStatusPanelProps) => {
  const show = (field: PatchField, deal: Deal | undefined, value?: string | number) => {
    const raw = value ?? deal?.[field];
    if (raw === undefined) return '—';
    if (field === 'stage') return isStageId(raw) ? STAGE_LABELS[raw] : String(raw);
    if (field === 'ownerId') return ownerName(String(raw));
    return formatInr(Number(raw));
  };
  const fields = Object.keys(state.patch) as PatchField[];

  if (state.status === SaveStatus.Saving) {
    return (
      <div className={styles.status} role="status">
        <Badge tone="info">Saving…</Badge>
        <span className={styles.muted}>Sending your change to the server.</span>
      </div>
    );
  }

  return (
    <div className={styles.status} role="alert">
      <Badge tone={state.status === SaveStatus.Conflict ? 'warning' : 'danger'}>
        {state.status === SaveStatus.Failed ? 'Not saved' : state.status}
      </Badge>
      <span>{state.message}</span>
      {state.status === SaveStatus.Failed && (
        <span className={styles.muted}>Your change is shown, but it is not saved yet.</span>
      )}
      {state.status === SaveStatus.Conflict && (
        <dl className={styles.diff} aria-label="Conflicting values">
          {fields.map((field) => (
            <div key={field} className={styles.diffRow}>
              <dt>{FIELD_LABELS[field]}</dt>
              <dd>Yours: {show(field, undefined, state.patch[field])}</dd>
              <dd>Latest: {show(field, state.theirs)}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className={styles.statusActions}>
        {state.status === SaveStatus.Failed && (
          <Button size="sm" variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
        {state.status === SaveStatus.Conflict && (
          <Button size="sm" variant="primary" onClick={onApplyMine}>
            Apply mine on latest
          </Button>
        )}
        <Button size="sm" onClick={onDiscard}>
          {state.status === SaveStatus.Failed
            ? 'Discard change'
            : state.status === SaveStatus.Conflict
              ? 'Keep theirs'
              : 'Dismiss'}
        </Button>
      </div>
    </div>
  );
};

import { Dialog, Input, Select } from '@pipeline/shared';
import { useMemo, useState } from 'react';

import type { StageId } from '@/constants/enums';
import { SaveStatus } from '@/constants/enums';
import { isStageId, STAGE_IDS, STAGE_LABELS } from '@/constants/pipeline';
import { activitiesFor } from '@/data/deal-activity';
import { canTransition, MAX_DEAL_VALUE_INR } from '@/data/deal-rules';
import { StageBadge } from '@/pages/SalesPipelinePage/components/StageBadge/StageBadge';
import type { ChangeEntry, Deal, DealPatch, Owner, PatchField } from '@/types/deal';
import type { SaveState } from '@/types/store';
import { formatDate, formatInr, formatNumber, formatRelative } from '@/utils/format';

import styles from './DealDrawer.module.css';
import { SaveStatusPanel } from './SaveStatusPanel';

const MAX_VALUE_CHARS = String(MAX_DEAL_VALUE_INR).length + 3;

const FIELD_LABELS: Readonly<Record<PatchField, string>> = {
  stage: 'Stage',
  ownerId: 'Owner',
  valueInr: 'Value',
};

export interface DealDrawerProps {
  deal: Deal | undefined;
  saveState: SaveState | undefined;
  history: ReadonlyArray<ChangeEntry>;
  owners: ReadonlyArray<Owner>;
  ownerName: (ownerId: string) => string;
  now: number;
  onClose: () => void;
  onMoveStage: (stage: StageId) => void;
  onEdit: (patch: DealPatch, label: string) => void;
  onRetry: () => void;
  onApplyMine: () => void;
  onDiscard: () => void;
}

export const DealDrawer = ({
  deal,
  saveState,
  history,
  owners,
  ownerName: nameOf,
  now,
  onClose,
  onMoveStage,
  onEdit,
  onRetry,
  onApplyMine,
  onDiscard,
}: DealDrawerProps) => {
  const [valueDraft, setValueDraft] = useState<string | null>(null);
  const activities = useMemo(() => (deal ? activitiesFor(deal) : []), [deal]);

  if (!deal) return null;

  const formatChange = (entry: ChangeEntry) =>
    entry.changes
      .map(({ field, to }) => {
        const value =
          field === 'stage'
            ? isStageId(to)
              ? STAGE_LABELS[to]
              : String(to)
            : field === 'ownerId'
              ? nameOf(String(to))
              : formatInr(Number(to));
        return `${FIELD_LABELS[field]} → ${value}`;
      })
      .join(', ');

  const save = (patch: DealPatch, label: string) => {
    onEdit(patch, `${deal.company}: ${label}`);
  };
  const saving = saveState?.status === SaveStatus.Saving;

  const value = valueDraft ?? formatNumber(deal.valueInr);
  const parsedValue = Number(value.replace(/[,\s₹]/g, ''));
  const valueError =
    valueDraft !== null && (!Number.isInteger(parsedValue) || parsedValue <= 0)
      ? 'Enter a whole INR amount above zero'
      : undefined;
  const commitValue = () => {
    if (valueDraft !== null && !valueError && parsedValue !== deal.valueInr) {
      save({ valueInr: parsedValue }, 'Value');
    }
    setValueDraft(null);
  };

  return (
    <Dialog open variant="drawer" title={deal.company} onClose={onClose}>
      <div className={styles.section}>
        <div>
          <StageBadge stage={deal.stage} />
        </div>
        <span>{deal.title}</span>
      </div>

      {saveState && (
        <SaveStatusPanel
          state={saveState}
          ownerName={nameOf}
          onRetry={onRetry}
          onApplyMine={onApplyMine}
          onDiscard={onDiscard}
        />
      )}

      <div className={styles.section}>
        <h3 className={styles.heading}>Details</h3>
        <dl className={styles.facts}>
          <dt>Deal ID</dt>
          <dd>{deal.id}</dd>
          <dt>Value</dt>
          <dd>{formatInr(deal.valueInr)}</dd>
          <dt>Licences</dt>
          <dd>{deal.licences}</dd>
          <dt>Owner</dt>
          <dd>{nameOf(deal.ownerId)}</dd>
          <dt>Expected close</dt>
          <dd>{formatDate(deal.expectedCloseDate)}</dd>
          <dt>Last activity</dt>
          <dd>{formatRelative(deal.lastActivityAt, now)}</dd>
          <dt>Record version</dt>
          <dd>v{deal.version}</dd>
          <dt>Updated</dt>
          <dd>{formatRelative(deal.updatedAt, now)}</dd>
        </dl>
      </div>

      <div className={styles.section}>
        <h3 className={styles.heading}>Edit</h3>
        <Select
          label="Stage"
          value={deal.stage}
          onChange={(next) => {
            onMoveStage(next);
          }}
          isDisabled={saving}
          options={STAGE_IDS.map((option) => ({
            value: option,
            label: STAGE_LABELS[option],
            disabled: !canTransition(deal.stage, option),
          }))}
        />
        <Select
          label="Owner"
          value={deal.ownerId}
          onChange={(ownerId) => {
            save({ ownerId }, 'Owner');
          }}
          isDisabled={saving}
          options={owners.map((owner) => ({ value: owner.id, label: owner.name }))}
        />
        <Input
          label="Value (INR)"
          inputMode="numeric"
          value={value}
          error={valueError}
          disabled={saving}
          onChange={(event) => {
            setValueDraft(event.target.value.replace(/[^\d,]/g, '').slice(0, MAX_VALUE_CHARS));
          }}
          onFocus={() => {
            setValueDraft(String(deal.valueInr));
          }}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape' && valueDraft !== null) {
              event.stopPropagation();
              setValueDraft(null);
            }
          }}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.heading}>Change history</h3>
        {history.length === 0 ? (
          <span className={styles.muted}>No changes yet.</span>
        ) : (
          <ul className={styles.timeline}>
            {history.map((entry) => (
              <li key={entry.version}>
                <span>
                  v{entry.version} · {entry.by}: {formatChange(entry)}
                </span>
                <span className={styles.muted}>{formatRelative(entry.at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.heading}>Activity</h3>
        <ul className={styles.timeline}>
          {activities.map((activity) => (
            <li key={activity.id}>
              <span>{activity.summary}</span>
              <span className={styles.muted}>
                {activity.kind} · {formatRelative(activity.at, now)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
};

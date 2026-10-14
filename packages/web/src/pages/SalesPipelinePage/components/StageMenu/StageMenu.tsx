import { Dropdown } from '@pipeline/shared';
import { Check, ChevronDown } from 'lucide-react';

import type { StageId } from '@/constants/enums';
import { STAGE_IDS, STAGE_LABELS } from '@/constants/pipeline';
import { canTransition } from '@/data/deal-rules';
import { StageBadge } from '@/pages/SalesPipelinePage/components/StageBadge/StageBadge';

import styles from './StageMenu.module.css';

export interface StageMenuProps {
  stage: StageId;
  company: string;
  disabled: boolean;
  onSelect: (stage: StageId) => void;
}

export const StageMenu = ({ stage, company, disabled, onSelect }: StageMenuProps) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <span
    className={styles.wrapper}
    onClick={(event) => {
      event.stopPropagation();
    }}
  >
    <Dropdown
      items={STAGE_IDS.map((option) => ({
        id: option,
        label: STAGE_LABELS[option],
        icon:
          option === stage ? (
            <Check size="0.875rem" aria-hidden="true" />
          ) : (
            <span className={styles.spacer} />
          ),
        disabled: !canTransition(stage, option),
        onSelect: () => {
          if (option !== stage) onSelect(option);
        },
      }))}
      renderTrigger={(props) => (
        <button
          type="button"
          className={styles.trigger}
          aria-label={`Change stage for ${company}, currently ${STAGE_LABELS[stage]}`}
          disabled={disabled}
          tabIndex={-1}
          {...props}
        >
          <StageBadge stage={stage} />
          <ChevronDown size="0.75rem" aria-hidden="true" />
        </button>
      )}
    />
  </span>
);

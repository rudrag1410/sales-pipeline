import type { BadgeTone } from '@pipeline/shared';
import { Badge } from '@pipeline/shared';

import type { StageId } from '@/constants/enums';
import { STAGE_LABELS } from '@/constants/pipeline';

const STAGE_TONES: Readonly<Record<StageId, BadgeTone>> = {
  new_lead: 'neutral',
  contacted: 'info',
  demo_done: 'info',
  proposal_sent: 'accent',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
};

export const StageBadge = ({ stage }: { stage: StageId }) => (
  <Badge tone={STAGE_TONES[stage]}>{STAGE_LABELS[stage]}</Badge>
);

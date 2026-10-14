import { StageId } from '@/constants/enums';
import {
  ALLOWED_REOPEN_TARGETS,
  CLOSED_STAGES,
  MS_PER_DAY,
  STAGE_LABELS,
  STALE_DEFAULT_DAYS,
} from '@/constants/pipeline';
import type { Deal, DealPatch } from '@/types/deal';
import type { RuleViolation } from '@/types/deal';

export const MAX_DEAL_VALUE_INR = 1_000_000_000;

export const isClosedStage = (stage: StageId): boolean => CLOSED_STAGES.includes(stage);

export const isOverdue = (deal: Deal, now: number): boolean =>
  !isClosedStage(deal.stage) && deal.expectedCloseDate < new Date(now).toISOString().slice(0, 10);

export const isIdle = (deal: Deal, now: number): boolean =>
  !isClosedStage(deal.stage) &&
  deal.lastActivityAt < new Date(now - STALE_DEFAULT_DAYS * MS_PER_DAY).toISOString();

export const canTransition = (from: StageId, to: StageId): boolean => {
  if (from === to) return true;
  if (from === StageId.Won || from === StageId.Lost)
    return ALLOWED_REOPEN_TARGETS[from].includes(to);
  return true;
};

export const describeTransitionRule = (from: StageId, to: StageId): string =>
  `${STAGE_LABELS[from]} deals cannot move directly to ${STAGE_LABELS[to]}`;

export const validatePatch = (
  current: Deal,
  patch: DealPatch,
  ownerExists: (id: string) => boolean,
): RuleViolation | null => {
  if (patch.stage !== undefined && !canTransition(current.stage, patch.stage)) {
    return { field: 'stage', message: describeTransitionRule(current.stage, patch.stage) };
  }
  if (patch.valueInr !== undefined) {
    if (
      !Number.isInteger(patch.valueInr) ||
      patch.valueInr <= 0 ||
      patch.valueInr > MAX_DEAL_VALUE_INR
    ) {
      return { field: 'valueInr', message: 'Deal value must be a whole INR amount above zero' };
    }
    if (isClosedStage(current.stage) && patch.valueInr !== current.valueInr) {
      return { field: 'valueInr', message: 'The value of a closed deal is locked' };
    }
  }
  if (patch.ownerId !== undefined && !ownerExists(patch.ownerId)) {
    return { field: 'ownerId', message: 'Unknown deal owner' };
  }
  return null;
};

export const patchIsNoop = (current: Deal, patch: DealPatch): boolean =>
  (patch.stage === undefined || patch.stage === current.stage) &&
  (patch.ownerId === undefined || patch.ownerId === current.ownerId) &&
  (patch.valueInr === undefined || patch.valueInr === current.valueInr);

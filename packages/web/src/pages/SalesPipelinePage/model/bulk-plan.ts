import { SaveStatus, SkipReason, type StageId } from '@/constants/enums';
import { STAGE_LABELS } from '@/constants/pipeline';
import { canTransition, describeTransitionRule } from '@/data/deal-rules';
import type { Deal, DealId } from '@/types/deal';
import type { SaveState } from '@/types/store';
import type { BulkPlan } from '@/types/view';

export const planStageChange = (
  deals: ReadonlyArray<Deal>,
  target: StageId,
  busy: ReadonlyMap<DealId, SaveState> = new Map(),
): BulkPlan => {
  const eligible: Deal[] = [];
  const skipped: Array<{ deal: Deal; reason: SkipReason; message: string }> = [];
  const skippedByReason: Record<SkipReason, number> = {
    [SkipReason.AlreadyInStage]: 0,
    [SkipReason.InvalidTransition]: 0,
    [SkipReason.Busy]: 0,
  };
  for (const deal of deals) {
    if (busy.get(deal.id)?.status === SaveStatus.Saving) {
      skipped.push({ deal, reason: SkipReason.Busy, message: 'Still saving' });
      skippedByReason[SkipReason.Busy] += 1;
    } else if (deal.stage === target) {
      skipped.push({
        deal,
        reason: SkipReason.AlreadyInStage,
        message: `Already in ${STAGE_LABELS[target]}`,
      });
      skippedByReason[SkipReason.AlreadyInStage] += 1;
    } else if (!canTransition(deal.stage, target)) {
      skipped.push({
        deal,
        reason: SkipReason.InvalidTransition,
        message: describeTransitionRule(deal.stage, target),
      });
      skippedByReason[SkipReason.InvalidTransition] += 1;
    } else {
      eligible.push(deal);
    }
  }
  return { eligible, skipped, skippedByReason };
};

import { useToasts } from '@pipeline/shared';

import type { SaveSummary } from '@/types/api';
import type { DealChange } from '@/types/store';

import { useDealSaver } from './useDeals';

const count = (value: number) => value.toLocaleString('en-IN');

export const useSaveAction = () => {
  const saver = useDealSaver();
  const toasts = useToasts();

  const run = async (
    changes: ReadonlyArray<DealChange>,
    label: string,
    undo?: ReadonlyArray<DealChange>,
  ): Promise<SaveSummary> => {
    const summary = await saver.save(changes);

    if (summary.failed > 0) {
      toasts.push({
        tone: 'danger',
        title: `${count(summary.failed)} ${summary.failed === 1 ? 'change' : 'changes'} not saved`,
        description: 'Your edits are still shown. Retry when you are ready.',
        actionLabel: 'Retry',
        onAction: () => {
          void saver.retryAllFailed();
        },
      });
    }
    if (summary.conflicts > 0) {
      toasts.push({
        tone: 'warning',
        title: `${count(summary.conflicts)} ${summary.conflicts === 1 ? 'conflict' : 'conflicts'}`,
        description: 'Someone else changed these deals first. Open the flagged rows to choose.',
      });
    }
    if (summary.rejected + summary.refused > 0) {
      toasts.push({
        tone: 'warning',
        title: `${count(summary.rejected + summary.refused)} skipped`,
        description: 'These changes are not allowed or the deal was busy.',
      });
    }
    if (summary.saved > 0) {
      toasts.push({
        tone: 'success',
        title: `${label}: ${count(summary.saved)} saved`,
        ...(undo && summary.saved === changes.length
          ? {
              actionLabel: 'Undo',
              onAction: () => {
                void run(undo, `Undid ${label}`);
              },
            }
          : {}),
      });
    }
    return summary;
  };

  return run;
};

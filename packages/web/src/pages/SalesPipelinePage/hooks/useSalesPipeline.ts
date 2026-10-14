import { useToasts } from '@pipeline/shared';

import type { StageId } from '@/constants/enums';
import { SaveStatus } from '@/constants/enums';
import { STAGE_LABELS } from '@/constants/pipeline';
import { saveConfig } from '@/data/services';
import { useDealResults } from '@/pages/SalesPipelinePage/hooks/useDealResults';
import {
  useDealSaver,
  useDealsLoader,
  useDealsStore,
  useFakeApi,
  useOwners,
  useRemoteMarks,
  useSaveStates,
  useSimulation,
} from '@/pages/SalesPipelinePage/hooks/useDeals';
import { useSaveAction } from '@/pages/SalesPipelinePage/hooks/useSaveAction';
import type { SimulationConfig } from '@/types/api';
import type { DealQuery } from '@/types/deal';
import type { SalesPipeline } from '@/types/pipeline';

export const useSalesPipeline = (query: DealQuery): SalesPipeline => {
  const store = useDealsStore();
  const saver = useDealSaver();
  const api = useFakeApi();
  const toasts = useToasts();
  const saveAction = useSaveAction();
  const load = useDealsLoader();
  const results = useDealResults(query);
  const { owners, nameOf } = useOwners();
  const saveStates = useSaveStates();
  const remoteMarks = useRemoteMarks();
  const simulation = useSimulation();

  const states = [...saveStates.values()];
  const saving = states.filter((state) => state.status === SaveStatus.Saving).length;
  const failed = states.filter((state) => state.status === SaveStatus.Failed).length;

  const moveStage = (dealId: string, stage: StageId) => {
    const deal = store.get(dealId);
    if (!deal || deal.stage === stage) return;
    void saveAction([{ dealId, patch: { stage } }], `${deal.company} → ${STAGE_LABELS[stage]}`, [
      { dealId, patch: { stage: deal.stage } },
    ]);
  };

  return {
    status: {
      isLoading: load.isPending,
      error: load.isError ? load.error.message : null,
      reload: () => {
        void load.refetch();
      },
    },
    results,
    owners,
    ownerName: nameOf,
    saveStates,
    remoteMarks,
    sync: {
      online: simulation.online,
      saving,
      failed,
      attention: states.length - saving,
      retryFailed: () => {
        if (failed === 0) {
          toasts.push({
            tone: 'info',
            title: 'Nothing to retry',
            description:
              'The remaining items are conflicts or rejected changes. Open the flagged rows.',
          });
          return;
        }
        void saver.retryAllFailed();
      },
    },
    now: store.now,
    getDeal: (dealId) => (dealId ? store.get(dealId) : undefined),
    historyOf: store.historyOf,
    actions: {
      moveStage,
      moveDeals: (dealIds, stage) => {
        void saveAction(
          dealIds.map((dealId) => ({ dealId, patch: { stage } })),
          `Moved to ${STAGE_LABELS[stage]}`,
        );
      },
      editDeal: (dealId, patch, label) => {
        void saveAction([{ dealId, patch }], label);
      },
      retry: (dealId) => {
        void saver.retry(dealId);
      },
      applyMine: (dealId) => {
        void saver.applyMine(dealId);
      },
      discard: store.discard,
      clearRemoteMarks: store.clearRemoteMarks,
    },
    simulation: {
      config: simulation,
      update: (patch: Partial<SimulationConfig>) => {
        api.setConfig(patch);
        saveConfig(api.getConfig());
      },
      failNext: (kind) => {
        api.failNext(kind);
      },
      teammateEdit: (fallbackDealId) => {
        const lastEdited = [...saveStates.keys()].pop();
        api.editAsTeammate(lastEdited ?? fallbackDealId ?? undefined);
      },
    },
  };
};

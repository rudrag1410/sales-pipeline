import { useToasts } from '@pipeline/shared';
import { useQueryClient } from '@tanstack/react-query';

import type { StageId } from '@/constants/enums';
import { SaveStatus } from '@/constants/enums';
import { STAGE_LABELS } from '@/constants/pipeline';
import { saveConfig } from '@/data/services';
import { SUMMARY_KEY, useDealPages } from '@/pages/SalesPipelinePage/hooks/useDealPages';
import {
  useDealSaver,
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
  const queryClient = useQueryClient();
  const pages = useDealPages(query);
  const refreshSummary = () => {
    void queryClient.invalidateQueries({ queryKey: [SUMMARY_KEY] });
  };
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
      isLoading: pages.isLoading,
      error: pages.error,
      rowsError: pages.rowsError,
      reload: pages.reload,
    },
    results: pages.results,
    requestRange: pages.requestRange,
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
        void saver.retryAllFailed().then(refreshSummary);
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
        ).then(refreshSummary);
      },
      editDeal: (dealId, patch, label) => {
        void saveAction([{ dealId, patch }], label).then(refreshSummary);
      },
      retry: (dealId) => {
        void saver.retry(dealId).then(refreshSummary);
      },
      applyMine: (dealId) => {
        void saver.applyMine(dealId).then(refreshSummary);
      },
      discard: store.discard,
      clearRemoteMarks: store.clearRemoteMarks,
      selectAllMatching: async () => {
        const matching = await api.listMatching(query);
        store.merge(matching);
        return matching.map((deal) => deal.id);
      },
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

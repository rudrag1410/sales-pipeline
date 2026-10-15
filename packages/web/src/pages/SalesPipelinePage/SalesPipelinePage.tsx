import { Button, useLatestCallback, useToasts } from '@pipeline/shared';
import { useRef, useState } from 'react';

import { SortDirection, type StageId } from '@/constants/enums';
import {
  CURRENT_OWNER_ID,
  EMPTY_STAGE_COUNTS,
  GRID_DOM_ID,
  OPEN_STAGES,
  STALE_DEFAULT_DAYS,
} from '@/constants/pipeline';
import { DEFAULT_SORT, queryCacheKey } from '@/data/deal-query';
import { BulkBar } from '@/pages/SalesPipelinePage/components/BulkBar/BulkBar';
import { BulkStageDialog } from '@/pages/SalesPipelinePage/components/BulkStageDialog/BulkStageDialog';
import { DealDrawer } from '@/pages/SalesPipelinePage/components/DealDrawer/DealDrawer';
import { DealsTable } from '@/pages/SalesPipelinePage/components/DealsTable/DealsTable';
import { GridLoadError } from '@/pages/SalesPipelinePage/components/DealsTable/GridLoadError/GridLoadError';
import { GridSkeleton } from '@/pages/SalesPipelinePage/components/DealsTable/GridSkeleton/GridSkeleton';
import { FilterToolbar } from '@/pages/SalesPipelinePage/components/FilterToolbar/FilterToolbar';
import { Header } from '@/pages/SalesPipelinePage/components/Header/Header';
import { MoveDealDialog } from '@/pages/SalesPipelinePage/components/MoveDealDialog/MoveDealDialog';
import { PipelineStats } from '@/pages/SalesPipelinePage/components/PipelineStats/PipelineStats';
import { SavedViewsBar } from '@/pages/SalesPipelinePage/components/SavedViewsBar/SavedViewsBar';
import { ShortcutsDialog } from '@/pages/SalesPipelinePage/components/ShortcutsDialog/ShortcutsDialog';
import { SimulationPanel } from '@/pages/SalesPipelinePage/components/SimulationPanel/SimulationPanel';
import { useGlobalShortcuts } from '@/pages/SalesPipelinePage/hooks/useGlobalShortcuts';
import { useSalesPipeline } from '@/pages/SalesPipelinePage/hooks/useSalesPipeline';
import { useViewActions } from '@/pages/SalesPipelinePage/hooks/useViewActions';
import { useViewState } from '@/pages/SalesPipelinePage/hooks/useViewState';
import { COLUMNS } from '@/pages/SalesPipelinePage/model/columns';
import { BUILTIN_VIEWS } from '@/pages/SalesPipelinePage/model/saved-views';
import { addSelected, EMPTY_SELECTION } from '@/pages/SalesPipelinePage/model/selection';
import type { SortField } from '@/types/deal';
import type { Selection } from '@/types/view';

import styles from './SalesPipelinePage.module.css';

const SalesPipelinePage = () => {
  const toasts = useToasts();
  const [view, changeView] = useViewState();
  const { query } = view;
  const pipeline = useSalesPipeline(query);
  const { results } = pipeline;
  const updateView: typeof changeView = (update) => {
    pipeline.actions.clearRemoteMarks();
    changeView(update);
  };
  const actions = useViewActions(updateView);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [bulkStage, setBulkStage] = useState<StageId | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filterKey = queryCacheKey({ ...query, sort: DEFAULT_SORT });
  const [selectionFilterKey, setSelectionFilterKey] = useState(filterKey);
  if (selectionFilterKey !== filterKey) {
    setSelectionFilterKey(filterKey);
    setSelection(EMPTY_SELECTION);
  }

  useGlobalShortcuts({
    onFocusSearch: useLatestCallback(() => {
      searchRef.current?.focus();
    }),
    onFocusGrid: useLatestCallback(() => {
      document.getElementById(GRID_DOM_ID)?.focus();
    }),
    onShowShortcuts: useLatestCallback(() => {
      setShowShortcuts(true);
    }),
  });

  const changeSelection = (next: Selection) => {
    setSelection(next);
    toasts.announce(
      next.size === 0 ? 'Selection cleared' : `${next.size.toLocaleString('en-IN')} selected`,
    );
  };

  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const ids = await pipeline.actions.selectAllMatching();
      changeSelection(addSelected(selection, ids));
    } catch (error) {
      toasts.push({
        tone: 'danger',
        title: 'Could not select all deals',
        description: error instanceof Error ? error.message : 'Try again.',
      });
    } finally {
      setSelectingAll(false);
    }
  };

  const changeSort = (field: SortField) => {
    const ascending = query.sort.field === field && query.sort.direction === SortDirection.Asc;
    const label = COLUMNS.find((column) => column.sortField === field)?.label ?? field;
    actions.toggleSort(field);
    toasts.announce(`Sorted by ${label}, ${ascending ? 'descending' : 'ascending'}`);
  };

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href={`#${GRID_DOM_ID}`}>
        Skip to deals table
      </a>
      <Header
        query={query}
        userName={pipeline.ownerName(CURRENT_OWNER_ID)}
        sync={pipeline.sync}
        searchRef={searchRef}
        onSearch={actions.setSearch}
        onFocusGrid={() => {
          document.getElementById(GRID_DOM_ID)?.focus();
        }}
        onOpenShortcuts={() => {
          setShowShortcuts(true);
        }}
        onOpenSimulation={() => {
          setShowSimulation(true);
        }}
      />
      <div className={styles.viewRow}>
        {selection.size > 0 ? (
          <BulkBar
            selection={selection}
            total={results.total}
            selectingAll={selectingAll}
            onSelectAllMatching={() => {
              void selectAllMatching();
            }}
            onSelectionChange={changeSelection}
            onChangeStage={setBulkStage}
          />
        ) : (
          <>
            <SavedViewsBar
              views={BUILTIN_VIEWS}
              activeId={view.viewId}
              onSelect={actions.applyView}
            />
            <PipelineStats
              results={results}
              onShowIdle={() => {
                actions.setQuery({ staleDays: STALE_DEFAULT_DAYS, stages: OPEN_STAGES });
              }}
            />
          </>
        )}
      </div>
      <FilterToolbar
        query={query}
        hiddenColumns={view.hiddenColumns}
        onQueryChange={actions.setQuery}
        onHiddenColumnsChange={actions.setHiddenColumns}
        owners={pipeline.owners}
        stageCounts={results.summary?.byStage ?? EMPTY_STAGE_COUNTS}
        onClear={actions.clearFilters}
      />
      {pipeline.status.rowsError && (
        <div className={styles.banner} role="alert">
          Some deals could not be loaded: {pipeline.status.rowsError}
          <Button size="sm" onClick={pipeline.status.reload}>
            Retry
          </Button>
        </div>
      )}
      {pipeline.status.error ? (
        <GridLoadError message={pipeline.status.error} onRetry={pipeline.status.reload} />
      ) : pipeline.status.isLoading ? (
        <GridSkeleton hiddenColumns={view.hiddenColumns} />
      ) : (
        <DealsTable
          query={query}
          results={results}
          saveStates={pipeline.saveStates}
          remoteMarks={pipeline.remoteMarks}
          ownerName={pipeline.ownerName}
          now={pipeline.now}
          hiddenColumns={view.hiddenColumns}
          selection={selection}
          onSelectionChange={changeSelection}
          onSortChange={changeSort}
          onOpenDeal={setDrawerId}
          onMoveDeal={setMoveId}
          onMoveStage={pipeline.actions.moveStage}
          onClearFilters={actions.resetAll}
          onRangeChange={pipeline.requestRange}
          onSelectAllMatching={() => {
            void selectAllMatching();
          }}
          selectingAll={selectingAll}
        />
      )}
      <DealDrawer
        deal={pipeline.getDeal(drawerId)}
        saveState={drawerId ? pipeline.saveStates.get(drawerId) : undefined}
        history={drawerId ? pipeline.historyOf(drawerId) : []}
        owners={pipeline.owners}
        ownerName={pipeline.ownerName}
        now={pipeline.now()}
        onClose={() => {
          setDrawerId(null);
        }}
        onMoveStage={(stage) => {
          if (drawerId) pipeline.actions.moveStage(drawerId, stage);
        }}
        onEdit={(patch, label) => {
          if (drawerId) pipeline.actions.editDeal(drawerId, patch, label);
        }}
        onRetry={() => {
          if (drawerId) pipeline.actions.retry(drawerId);
        }}
        onApplyMine={() => {
          if (drawerId) pipeline.actions.applyMine(drawerId);
        }}
        onDiscard={() => {
          if (drawerId) pipeline.actions.discard(drawerId);
        }}
      />
      <MoveDealDialog
        deal={pipeline.getDeal(moveId)}
        onMove={(stage) => {
          if (moveId) pipeline.actions.moveStage(moveId, stage);
        }}
        onClose={() => {
          setMoveId(null);
        }}
      />
      {bulkStage && (
        <BulkStageDialog
          deals={[...selection].flatMap((id) => pipeline.getDeal(id) ?? [])}
          saveStates={pipeline.saveStates}
          initialStage={bulkStage}
          onApply={(dealIds, stage) => {
            pipeline.actions.moveDeals(dealIds, stage);
            setBulkStage(null);
            setSelection(EMPTY_SELECTION);
          }}
          onClose={() => {
            setBulkStage(null);
          }}
        />
      )}
      {showSimulation && (
        <SimulationPanel
          simulation={pipeline.simulation}
          openDealId={drawerId}
          onClose={() => {
            setShowSimulation(false);
          }}
        />
      )}
      {showShortcuts && (
        <ShortcutsDialog
          onClose={() => {
            setShowShortcuts(false);
          }}
        />
      )}
    </main>
  );
};

export default SalesPipelinePage;

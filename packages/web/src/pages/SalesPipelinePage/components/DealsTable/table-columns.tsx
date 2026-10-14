import { Checkbox, cx } from '@pipeline/shared';
import { createColumnHelper } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { SaveStatus } from '@/constants/enums';
import { isIdle, isOverdue } from '@/data/deal-rules';
import { StageMenu } from '@/pages/SalesPipelinePage/components/StageMenu/StageMenu';
import { SyncIndicator } from '@/pages/SalesPipelinePage/components/SyncIndicator/SyncIndicator';
import { COLUMNS, SELECT_COLUMN_ID } from '@/pages/SalesPipelinePage/model/columns';
import type { ColumnId } from '@/types/view';
import type { RowContextValue, RowData } from '@/types/view';
import { formatDate, formatInr, formatNumber, formatRelative } from '@/utils/format';

import styles from './table-columns.module.css';

export const RowContext = createContext<RowContextValue | null>(null);

const useRow = (): RowContextValue => {
  const ctx = useContext(RowContext);
  if (!ctx) throw new Error('Cell rendered outside a row');
  return ctx;
};

const helper = createColumnHelper<RowData>();

const CELL_RENDERERS: Readonly<Record<ColumnId, (row: RowContextValue) => ReactNode>> = {
  select: ({ deal, selected, toggleSelected }) => (
    <Checkbox
      checked={selected}
      onChange={toggleSelected}
      onClick={(event) => {
        event.stopPropagation();
      }}
      aria-label={`Select ${deal.company}`}
    />
  ),
  company: ({ deal, saveState, remoteBy }) => (
    <span className={styles.companyCell}>
      <span className={styles.truncate}>{deal.company}</span>
      <SyncIndicator state={saveState} remoteBy={remoteBy} />
    </span>
  ),
  title: ({ deal }) => <span className={styles.truncate}>{deal.title}</span>,
  valueInr: ({ deal }) => <span>{formatInr(deal.valueInr)}</span>,
  licences: ({ deal }) => <span>{formatNumber(deal.licences)}</span>,
  stage: ({ deal, saveState, moveStage }) => (
    <StageMenu
      stage={deal.stage}
      company={deal.company}
      disabled={saveState?.status === SaveStatus.Saving}
      onSelect={moveStage}
    />
  ),
  ownerId: ({ deal, ownerName }) => (
    <span className={styles.truncate}>{ownerName(deal.ownerId)}</span>
  ),
  expectedCloseDate: ({ deal, now }) => (
    <span className={styles.signalCell}>
      {formatDate(deal.expectedCloseDate)}
      {isOverdue(deal, now) && <span className={styles.overdue}>Overdue</span>}
    </span>
  ),
  lastActivityAt: ({ deal, now }) => (
    <span className={cx(styles.signalCell, isIdle(deal, now) && styles.idle)}>
      {formatRelative(deal.lastActivityAt, now)}
    </span>
  ),
  version: ({ deal }) => <span>v{deal.version}</span>,
  updatedAt: ({ deal, now }) => <span>{formatRelative(deal.updatedAt, now)}</span>,
};

const Cell = ({ id }: { id: ColumnId }) => CELL_RENDERERS[id](useRow());

export const TABLE_COLUMNS = COLUMNS.map((column) =>
  helper.display({
    id: column.id,
    header: column.label,
    size: column.width,
    minSize: column.minWidth,
    enableSorting: column.sortField !== null,
    enableHiding: column.hideable,
    enableResizing: column.id !== SELECT_COLUMN_ID,
    meta: column,
    cell: () => <Cell id={column.id} />,
  }),
);

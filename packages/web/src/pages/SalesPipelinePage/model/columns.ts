import type { ColumnId, ColumnMeta } from '@/types/view';

export const COLUMNS: ReadonlyArray<ColumnMeta> = [
  { id: 'select', label: 'Select', width: 40, minWidth: 40, sortField: null, hideable: false },
  {
    id: 'company',
    label: 'Company',
    width: 220,
    minWidth: 120,
    sortField: 'company',
    hideable: false,
  },
  {
    id: 'title',
    label: 'Deal',
    width: 240,
    minWidth: 120,
    sortField: 'title',
    hideable: true,
  },
  {
    id: 'valueInr',
    label: 'Value (INR)',
    width: 130,
    minWidth: 90,
    sortField: 'valueInr',
    hideable: true,
    align: 'right',
  },
  {
    id: 'licences',
    label: 'Licences',
    width: 90,
    minWidth: 70,
    sortField: 'licences',
    hideable: true,
    align: 'right',
  },
  {
    id: 'stage',
    label: 'Stage',
    width: 150,
    minWidth: 100,
    sortField: 'stage',
    hideable: true,
  },
  {
    id: 'ownerId',
    label: 'Owner',
    width: 150,
    minWidth: 100,
    sortField: 'ownerId',
    hideable: true,
  },
  {
    id: 'expectedCloseDate',
    label: 'Expected close',
    width: 190,
    minWidth: 170,
    sortField: 'expectedCloseDate',
    hideable: true,
  },
  {
    id: 'lastActivityAt',
    label: 'Last activity',
    width: 130,
    minWidth: 100,
    sortField: 'lastActivityAt',
    hideable: true,
  },
  {
    id: 'version',
    label: 'Version',
    width: 80,
    minWidth: 60,
    sortField: null,
    hideable: true,
    align: 'right',
  },
  {
    id: 'updatedAt',
    label: 'Updated',
    width: 130,
    minWidth: 100,
    sortField: 'updatedAt',
    hideable: true,
  },
];

export const DEFAULT_HIDDEN_COLUMNS: ReadonlyArray<ColumnId> = ['version'];
export const COLUMN_IDS: ReadonlyArray<ColumnId> = COLUMNS.map((c) => c.id);

export const SELECT_COLUMN_ID: ColumnId = 'select';

import { Button, Dropdown, Input, Popover } from '@pipeline/shared';
import { CalendarDays, Check, Clock, Columns3, IndianRupee, Layers, Users } from 'lucide-react';
import { useState } from 'react';

import type { StageId } from '@/constants/enums';
import { FILTER_DEBOUNCE_MS, STAGE_IDS, STAGE_LABELS } from '@/constants/pipeline';
import { MAX_DEAL_VALUE_INR } from '@/data/deal-rules';
import { FilterChip } from '@/pages/SalesPipelinePage/components/FilterChip/FilterChip';
import { useDebouncedCallback } from '@/pages/SalesPipelinePage/hooks/useDebouncedCallback';
import { COLUMNS } from '@/pages/SalesPipelinePage/model/columns';
import { hasActiveFilters } from '@/pages/SalesPipelinePage/model/view-state';
import type { DealQuery, Owner } from '@/types/deal';
import type { ColumnId } from '@/types/view';
import { formatInrCompact, formatNumber } from '@/utils/format';

import styles from './FilterToolbar.module.css';

const ICON_SIZE = '0.875rem';

const STALE_OPTIONS = [
  { value: null, label: 'Any activity' },
  { value: 14, label: 'No activity 14d+' },
  { value: 30, label: 'No activity 30d+' },
  { value: 60, label: 'No activity 60d+' },
  { value: 90, label: 'No activity 90d+' },
];

const MAX_DIGITS = String(MAX_DEAL_VALUE_INR).length;
const digitsOnly = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, MAX_DIGITS);
  return Number(digits) > MAX_DEAL_VALUE_INR ? String(MAX_DEAL_VALUE_INR) : digits;
};
const toNumber = (value: string): number | null =>
  value.trim() === '' || Number.isNaN(Number(value))
    ? null
    : Math.min(Number(value), MAX_DEAL_VALUE_INR);
const toggle = <T,>(list: ReadonlyArray<T>, item: T): T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

const stageSummary = (query: DealQuery): string | null => {
  const [first] = query.stages;
  if (!first) return null;
  return query.stages.length === 1 ? STAGE_LABELS[first] : `${query.stages.length} stages`;
};

const ownerSummary = (query: DealQuery, owners: ReadonlyArray<Owner>): string | null => {
  if (query.ownerIds.length === 0) return null;
  const first = owners.find((owner) => owner.id === query.ownerIds[0]);
  return query.ownerIds.length === 1
    ? (first?.name ?? '1 owner')
    : `${query.ownerIds.length} owners`;
};

const valueSummary = (query: DealQuery): string | null => {
  const { valueMin, valueMax } = query;
  if (valueMin !== null && valueMax !== null)
    return `${formatInrCompact(valueMin)} – ${formatInrCompact(valueMax)}`;
  if (valueMin !== null) return `≥ ${formatInrCompact(valueMin)}`;
  if (valueMax !== null) return `≤ ${formatInrCompact(valueMax)}`;
  return null;
};

const closeSummary = (query: DealQuery): string | null => {
  if (query.closeWithinDays !== null) return `next ${query.closeWithinDays} days`;
  if (query.closeFrom && query.closeTo) return `${query.closeFrom} → ${query.closeTo}`;
  if (query.closeFrom) return `from ${query.closeFrom}`;
  if (query.closeTo) return `until ${query.closeTo}`;
  return null;
};

export interface FilterToolbarProps {
  query: DealQuery;
  hiddenColumns: ReadonlyArray<ColumnId>;
  onQueryChange: (patch: Partial<DealQuery>) => void;
  onHiddenColumnsChange: (columns: ReadonlyArray<ColumnId>) => void;
  owners: ReadonlyArray<Owner>;
  stageCounts: Readonly<Record<StageId, number>>;
  onClear: () => void;
}

export const FilterToolbar = ({
  query,
  hiddenColumns,
  onQueryChange,
  onHiddenColumnsChange,
  owners,
  stageCounts,
  onClear,
}: FilterToolbarProps) => {
  const [min, setMin] = useState(query.valueMin === null ? '' : String(query.valueMin));
  const [max, setMax] = useState(query.valueMax === null ? '' : String(query.valueMax));

  const commitRange = useDebouncedCallback((minText: string, maxText: string) => {
    onQueryChange({ valueMin: toNumber(minText), valueMax: toNumber(maxText) });
  }, FILTER_DEBOUNCE_MS);

  const syncKey = `${query.valueMin}:${query.valueMax}`;
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncedKey !== syncKey) {
    setSyncedKey(syncKey);
    setMin(query.valueMin === null ? '' : String(query.valueMin));
    setMax(query.valueMax === null ? '' : String(query.valueMax));
  }

  const rangeError =
    query.valueMin !== null && query.valueMax !== null && query.valueMin > query.valueMax
      ? 'Max is lower than min'
      : undefined;
  const dateError =
    query.closeFrom && query.closeTo && query.closeFrom > query.closeTo
      ? 'End is before the start'
      : undefined;

  return (
    <div className={styles.filters} role="group" aria-label="Filters">
      <Dropdown
        items={STAGE_IDS.map((stage) => ({
          id: stage,
          label: `${STAGE_LABELS[stage]} · ${formatNumber(stageCounts[stage])}`,
          checked: query.stages.includes(stage),
          onSelect: () => {
            onQueryChange({ stages: toggle<StageId>(query.stages, stage) });
          },
        }))}
        renderTrigger={(props) => (
          <FilterChip
            label="Stage"
            icon={<Layers size={ICON_SIZE} aria-hidden="true" />}
            summary={stageSummary(query)}
            onClear={() => {
              onQueryChange({ stages: [] });
            }}
            triggerProps={props}
          />
        )}
      />
      <Dropdown
        items={owners.map((owner) => ({
          id: owner.id,
          label: owner.name,
          checked: query.ownerIds.includes(owner.id),
          onSelect: () => {
            onQueryChange({ ownerIds: toggle(query.ownerIds, owner.id) });
          },
        }))}
        renderTrigger={(props) => (
          <FilterChip
            label="Owner"
            icon={<Users size={ICON_SIZE} aria-hidden="true" />}
            summary={ownerSummary(query, owners)}
            onClear={() => {
              onQueryChange({ ownerIds: [] });
            }}
            triggerProps={props}
          />
        )}
      />
      <Popover
        label="Value filter"
        renderTrigger={(props) => (
          <FilterChip
            label="Value"
            icon={<IndianRupee size={ICON_SIZE} aria-hidden="true" />}
            summary={valueSummary(query)}
            onClear={() => {
              onQueryChange({ valueMin: null, valueMax: null });
            }}
            triggerProps={props}
          />
        )}
      >
        <div className={styles.fields}>
          <Input
            label="Min value (₹)"
            inputMode="numeric"
            maxLength={MAX_DIGITS}
            placeholder="Any"
            value={min}
            onChange={(e) => {
              const next = digitsOnly(e.target.value);
              setMin(next);
              commitRange(next, max);
            }}
          />
          <Input
            label="Max value (₹)"
            error={rangeError}
            inputMode="numeric"
            maxLength={MAX_DIGITS}
            placeholder="Any"
            value={max}
            onChange={(e) => {
              const next = digitsOnly(e.target.value);
              setMax(next);
              commitRange(min, next);
            }}
          />
        </div>
      </Popover>
      <Popover
        label="Close date filter"
        renderTrigger={(props) => (
          <FilterChip
            label="Close date"
            icon={<CalendarDays size={ICON_SIZE} aria-hidden="true" />}
            summary={closeSummary(query)}
            onClear={() => {
              onQueryChange({ closeFrom: null, closeTo: null, closeWithinDays: null });
            }}
            triggerProps={props}
          />
        )}
      >
        <div className={styles.fields}>
          <Input
            label="Close from"
            type="date"
            value={query.closeFrom ?? ''}
            onChange={(e) => {
              onQueryChange({ closeFrom: e.target.value || null, closeWithinDays: null });
            }}
          />
          <Input
            label="Close to"
            error={dateError}
            type="date"
            value={query.closeTo ?? ''}
            onChange={(e) => {
              onQueryChange({ closeTo: e.target.value || null, closeWithinDays: null });
            }}
          />
        </div>
      </Popover>
      <Dropdown
        items={[
          ...STALE_OPTIONS,
          ...(query.staleDays !== null && !STALE_OPTIONS.some((o) => o.value === query.staleDays)
            ? [{ value: query.staleDays, label: `No activity ${query.staleDays}d+` }]
            : []),
        ].map((option) => ({
          id: String(option.value),
          label: option.label,
          icon:
            option.value === query.staleDays ? (
              <Check size={ICON_SIZE} aria-hidden="true" />
            ) : (
              <span className={styles.checkSpace} />
            ),
          onSelect: () => {
            onQueryChange({ staleDays: option.value });
          },
        }))}
        renderTrigger={(props) => (
          <FilterChip
            label="Activity"
            icon={<Clock size={ICON_SIZE} aria-hidden="true" />}
            summary={query.staleDays === null ? null : `${query.staleDays}d+ idle`}
            onClear={() => {
              onQueryChange({ staleDays: null });
            }}
            triggerProps={props}
          />
        )}
      />
      {hasActiveFilters({ ...query, search: '' }) && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      )}
      <div className={styles.spacer} />
      <Dropdown
        items={COLUMNS.filter((c) => c.hideable).map((column) => ({
          id: column.id,
          label: column.label,
          checked: !hiddenColumns.includes(column.id),
          onSelect: () => {
            onHiddenColumnsChange(toggle(hiddenColumns, column.id));
          },
        }))}
        renderTrigger={(props) => (
          <Button size="sm" icon={<Columns3 size={ICON_SIZE} />} {...props}>
            Columns
          </Button>
        )}
      />
    </div>
  );
};

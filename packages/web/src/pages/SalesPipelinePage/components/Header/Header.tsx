import { IconButton, Input, Tooltip } from '@pipeline/shared';
import { Keyboard, Search, SlidersHorizontal, TrendingUp } from 'lucide-react';
import type { KeyboardEvent, Ref } from 'react';
import { useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@/constants/pipeline';
import { SyncStatusChip } from '@/pages/SalesPipelinePage/components/SyncStatusChip/SyncStatusChip';
import { useDebouncedCallback } from '@/pages/SalesPipelinePage/hooks/useDebouncedCallback';
import type { DealQuery } from '@/types/deal';
import type { SyncSummary } from '@/types/pipeline';
import { MODIFIER_KEY_LABEL } from '@/utils/platform';

import styles from './Header.module.css';

export interface HeaderProps {
  query: DealQuery;
  userName: string;
  sync: SyncSummary;
  searchRef: Ref<HTMLInputElement>;
  onSearch: (value: string) => void;
  onFocusGrid: () => void;
  onOpenShortcuts: () => void;
  onOpenSimulation: () => void;
}

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2);

export const Header = ({
  query,
  userName,
  sync,
  searchRef,
  onSearch,
  onFocusGrid,
  onOpenShortcuts,
  onOpenSimulation,
}: HeaderProps) => {
  const [draft, setDraft] = useState(query.search);
  const commitSearch = useDebouncedCallback(onSearch, SEARCH_DEBOUNCE_MS);

  const [syncedSearch, setSyncedSearch] = useState(query.search);
  if (syncedSearch !== query.search) {
    setSyncedSearch(query.search);
    setDraft(query.search);
  }

  const change = (value: string) => {
    setDraft(value);
    commitSearch(value);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      onFocusGrid();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (draft) change('');
      else onFocusGrid();
    }
  };

  const you = userName;
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <TrendingUp size="1.125rem" />
          </span>
          <div className={styles.title}>
            <span className={styles.product}>Pipeline CRM</span>
            <h1>Sales Pipeline</h1>
          </div>
        </div>
        <div className={styles.searchBox}>
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search deals"
            aria-keyshortcuts="Control+K Meta+K /"
            placeholder="Search company, deal or ID"
            icon={<Search size="0.875rem" />}
            value={draft}
            onChange={(e) => {
              change(e.target.value);
            }}
            onKeyDown={onSearchKeyDown}
          />
          <kbd className={styles.searchHint} aria-hidden="true">
            {MODIFIER_KEY_LABEL} K
          </kbd>
        </div>
        <div className={styles.actions}>
          <SyncStatusChip sync={sync} />
          <Tooltip content="Keyboard shortcuts (?)">
            <IconButton
              aria-label="Keyboard shortcuts"
              icon={<Keyboard size="1rem" />}
              onClick={onOpenShortcuts}
            />
          </Tooltip>
          <Tooltip content="Simulation settings">
            <IconButton
              aria-label="Simulation settings"
              icon={<SlidersHorizontal size="1rem" />}
              onClick={onOpenSimulation}
            />
          </Tooltip>
          <span className={styles.avatar} role="img" aria-label={`Signed in as ${you}`} title={you}>
            {initialsOf(you)}
          </span>
        </div>
      </div>
    </header>
  );
};

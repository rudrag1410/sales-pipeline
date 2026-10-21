import { Button, Dropdown, IconButton, Input, Skeleton } from '@pipeline/shared';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';

import { PAGE_SIZES } from '@/constants/pipeline';
import type { PagingInfo } from '@/types/pipeline';
import { formatNumber } from '@/utils/format';

import styles from './Pagination.module.css';

const ICON_SIZE = '1rem';

export interface PaginationProps {
  paging: PagingInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination = ({ paging, onPageChange, onPageSizeChange }: PaginationProps) => {
  const { page, pageSize, pageCount, total, from, to, loading } = paging;
  const [draft, setDraft] = useState(String(page));
  const [syncedPage, setSyncedPage] = useState(page);
  if (syncedPage !== page) {
    setSyncedPage(page);
    setDraft(String(page));
  }

  const commitDraft = () => {
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 1) {
      setDraft(String(page));
      return;
    }
    const clamped = Math.min(next, pageCount);
    setDraft(String(clamped));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p className={styles.range} aria-live="polite">
        {total === 0
          ? 'No deals'
          : `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)} deals`}
      </p>
      <div className={styles.controls}>
        <Dropdown
          items={PAGE_SIZES.map((size) => ({
            id: String(size),
            label: `${size} per page`,
            checked: size === pageSize,
            onSelect: () => {
              onPageSizeChange(size);
            },
          }))}
          renderTrigger={(props) => (
            <Button size="sm" {...props}>
              {pageSize} per page
            </Button>
          )}
        />
        <IconButton
          size="sm"
          aria-label="First page"
          icon={<ChevronsLeft size={ICON_SIZE} />}
          disabled={page <= 1}
          onClick={() => {
            onPageChange(1);
          }}
        />
        <IconButton
          size="sm"
          aria-label="Previous page"
          icon={<ChevronLeft size={ICON_SIZE} />}
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        />
        <span className={styles.jump}>
          Page
          <span className={styles.pageInput}>
            <Input
              aria-label="Page number"
              inputMode="numeric"
              value={draft}
              disabled={pageCount <= 1}
              onChange={(event) => {
                setDraft(event.target.value.replace(/\D/g, '').slice(0, 7));
              }}
              onBlur={commitDraft}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitDraft();
                } else if (event.key === 'Escape') {
                  setDraft(String(page));
                }
              }}
            />
          </span>
          <span>of {formatNumber(pageCount)}</span>
        </span>
        <IconButton
          size="sm"
          aria-label="Next page"
          icon={<ChevronRight size={ICON_SIZE} />}
          disabled={page >= pageCount}
          aria-busy={loading}
          onClick={() => {
            onPageChange(page + 1);
          }}
        />
        <IconButton
          size="sm"
          aria-label="Last page"
          icon={<ChevronsRight size={ICON_SIZE} />}
          disabled={page >= pageCount}
          onClick={() => {
            onPageChange(pageCount);
          }}
        />
      </div>
    </nav>
  );
};

export const PaginationSkeleton = () => (
  <div className={styles.pagination} role="status" aria-label="Loading pagination">
    <Skeleton width="9rem" />
    <div className={styles.controls}>
      <Skeleton width="5.5rem" />
      <Skeleton width="7rem" />
      <Skeleton width="2rem" />
    </div>
  </div>
);

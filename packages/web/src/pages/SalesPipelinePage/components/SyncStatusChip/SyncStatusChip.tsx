import { cx } from '@pipeline/shared';
import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from 'lucide-react';

import type { SyncSummary } from '@/types/pipeline';

import styles from './SyncStatusChip.module.css';

const ICON_SIZE = '0.875rem';

export const SyncStatusChip = ({ sync }: { sync: SyncSummary }) => {
  const { online, saving, failed, attention, retryFailed } = sync;

  if (!online) {
    return (
      <span className={cx(styles.syncChip, styles.syncBad)} role="status">
        <WifiOff size={ICON_SIZE} aria-hidden="true" />
        Offline
      </span>
    );
  }
  if (attention > 0) {
    return (
      <button
        type="button"
        className={cx(styles.syncChip, styles.syncBad)}
        title={
          failed > 0 ? 'Retry every save that failed' : 'Open the flagged rows to resolve them'
        }
        onClick={retryFailed}
      >
        <AlertTriangle size={ICON_SIZE} aria-hidden="true" />
        {attention.toLocaleString('en-IN')} need attention{failed > 0 ? ' · Retry' : ''}
        {saving > 0 ? ` · ${saving.toLocaleString('en-IN')} saving` : ''}
      </button>
    );
  }
  if (saving > 0) {
    return (
      <span className={cx(styles.syncChip, styles.syncBusy)} role="status">
        <Loader2 size={ICON_SIZE} className={styles.spin} aria-hidden="true" />
        Saving {saving.toLocaleString('en-IN')}…
      </span>
    );
  }
  return (
    <span className={cx(styles.syncChip, styles.syncOk)} role="status">
      <CheckCircle2 size={ICON_SIZE} aria-hidden="true" />
      All changes saved
    </span>
  );
};

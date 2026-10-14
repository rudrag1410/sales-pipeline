import { cx, VisuallyHidden } from '@pipeline/shared';
import { AlertTriangle, Ban, GitPullRequestArrow, Loader2, Radio } from 'lucide-react';
import type { ReactNode } from 'react';

import { SaveStatus } from '@/constants/enums';
import type { SaveState } from '@/types/store';

import styles from './SyncIndicator.module.css';

const ICON_SIZE = '0.75rem';

const LABELS: Readonly<Record<SaveStatus, string>> = {
  [SaveStatus.Saving]: 'Saving…',
  [SaveStatus.Failed]: 'Not saved',
  [SaveStatus.Conflict]: 'Conflict',
  [SaveStatus.Rejected]: 'Rejected',
};

const ICONS: Readonly<Record<SaveStatus, ReactNode>> = {
  [SaveStatus.Saving]: <Loader2 size={ICON_SIZE} className={styles.spin} aria-hidden="true" />,
  [SaveStatus.Failed]: <AlertTriangle size={ICON_SIZE} aria-hidden="true" />,
  [SaveStatus.Conflict]: <GitPullRequestArrow size={ICON_SIZE} aria-hidden="true" />,
  [SaveStatus.Rejected]: <Ban size={ICON_SIZE} aria-hidden="true" />,
};

export const SyncIndicator = ({
  state,
  remoteBy,
}: {
  state: SaveState | undefined;
  remoteBy: string | undefined;
}) => {
  if (state) {
    const label = LABELS[state.status];
    return (
      <span className={cx(styles.indicator, styles[state.status])} title={state.message ?? label}>
        {ICONS[state.status]}
        {state.status === SaveStatus.Saving ? <VisuallyHidden>{label}</VisuallyHidden> : label}
      </span>
    );
  }
  if (remoteBy) {
    return (
      <span className={cx(styles.indicator, styles.remote)} title={`Updated by ${remoteBy}`}>
        <Radio size={ICON_SIZE} aria-hidden="true" />
        <VisuallyHidden>Updated by {remoteBy}</VisuallyHidden>
      </span>
    );
  }
  return null;
};

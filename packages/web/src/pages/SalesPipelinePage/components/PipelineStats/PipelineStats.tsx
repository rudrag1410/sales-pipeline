import { cx, Tooltip } from '@pipeline/shared';

import { StageId } from '@/constants/enums';
import type { DealResults } from '@/types/view';
import { formatInrCompact, formatNumber } from '@/utils/format';

import styles from './PipelineStats.module.css';

const PERCENT = 100;

const winRate = (byStage: DealResults['byStage']): string => {
  const won = byStage[StageId.Won];
  const closed = won + byStage[StageId.Lost];
  return closed === 0 ? '—' : `${Math.round((won / closed) * PERCENT)}%`;
};

const KpiCard = ({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  onClick?: () => void;
}) => (
  <Tooltip content={hint}>
    <div className={cx(styles.stat, onClick && styles.clickable)}>
      {onClick ? (
        <button type="button" className={styles.action} onClick={onClick}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{value}</span>
        </button>
      ) : (
        <>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{value}</span>
        </>
      )}
    </div>
  </Tooltip>
);

export interface PipelineStatsProps {
  results: DealResults;
  onShowIdle: () => void;
}

export const PipelineStats = ({ results, onShowIdle }: PipelineStatsProps) => (
  <div className={styles.stats} role="group" aria-label="Pipeline metrics">
    <KpiCard
      label="Deals"
      value={formatNumber(results.matchingNow)}
      hint="Deals that match the current search and filters"
    />
    <KpiCard
      label="Value"
      value={formatInrCompact(results.totalValueInr)}
      hint="Total value of the matching deals"
    />
    <KpiCard
      label="Idle 30d+"
      value={formatNumber(results.staleCount)}
      hint="Open deals with no activity for 30 days. Click to see them."
      onClick={onShowIdle}
    />
    <KpiCard
      label="Win rate"
      value={winRate(results.byStage)}
      hint="Won ÷ (won + lost), among the matching deals"
    />
  </div>
);

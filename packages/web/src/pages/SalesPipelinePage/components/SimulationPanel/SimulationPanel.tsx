import { Button, Checkbox, Dialog, Input, Select } from '@pipeline/shared';
import { useState } from 'react';

import { InjectedFailure } from '@/constants/enums';
import type { SimulationControls } from '@/types/pipeline';

import styles from './SimulationPanel.module.css';

const PERCENT = 100;
const TEAMMATE_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '0.3', label: 'Low (about 1 edit every 3 s)' },
  { value: '2', label: 'Medium (2 edits / s)' },
  { value: '10', label: 'High (10 edits / s)' },
];

const toNumber = (value: string, fallback: number) =>
  value === '' || Number.isNaN(Number(value)) ? fallback : Number(value);

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max?: number;
  onCommit: (value: number) => void;
}

const NumberField = ({ label, value, min, max, onCommit }: NumberFieldProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={min}
      {...(max === undefined ? {} : { max })}
      value={draft ?? String(value)}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (text !== '') onCommit(toNumber(text, min));
      }}
      onBlur={() => {
        setDraft(null);
      }}
    />
  );
};

export interface SimulationPanelProps {
  simulation: SimulationControls;
  openDealId: string | null;
  onClose: () => void;
}

export const SimulationPanel = ({ simulation, openDealId, onClose }: SimulationPanelProps) => {
  const { config, update: set, failNext, teammateEdit } = simulation;

  return (
    <Dialog open title="Simulation settings" onClose={onClose}>
      <div className={styles.stack}>
        <p className={styles.tight}>
          Everything runs in this browser. These controls change how the fake server behaves so you
          can test slow networks, failed saves, going offline and other people editing.
        </p>
        <Checkbox
          label="Network online"
          checked={config.online}
          onChange={(event) => {
            set({ online: event.target.checked });
          }}
        />
        <div className={styles.grid2}>
          <NumberField
            label="Latency min (ms)"
            min={0}
            value={config.latencyMinMs}
            onCommit={(latencyMinMs) => {
              set({ latencyMinMs });
            }}
          />
          <NumberField
            label="Latency max (ms)"
            min={0}
            value={config.latencyMaxMs}
            onCommit={(latencyMaxMs) => {
              set({ latencyMaxMs });
            }}
          />
          <NumberField
            label="Save failure rate (%)"
            min={0}
            max={PERCENT}
            value={Math.round(config.failureRate * PERCENT)}
            onCommit={(percent) => {
              set({ failureRate: Math.min(1, Math.max(0, percent / PERCENT)) });
            }}
          />
          <Select
            label="Teammate activity"
            value={String(config.teammateRate)}
            onChange={(value) => {
              set({ teammateRate: Number(value) });
            }}
            options={TEAMMATE_OPTIONS}
          />
        </div>
        <div className={styles.actions}>
          <Button
            onClick={() => {
              failNext(InjectedFailure.RequestLost);
            }}
          >
            Fail next save (request lost)
          </Button>
          <Button
            onClick={() => {
              failNext(InjectedFailure.ResponseLost);
            }}
          >
            Fail next save (response lost)
          </Button>
          <Button
            onClick={() => {
              teammateEdit(openDealId);
            }}
          >
            A teammate edits the deal you just changed
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

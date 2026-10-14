import { Button } from '@pipeline/shared';

import styles from './GridLoadError.module.css';

export interface GridLoadErrorProps {
  message: string;
  onRetry: () => void;
}

export const GridLoadError = ({ message, onRetry }: GridLoadErrorProps) => (
  <div className={styles.state} role="alert">
    <strong>Could not load deals</strong>
    <span>{message}</span>
    <Button variant="primary" onClick={onRetry}>
      Try again
    </Button>
  </div>
);

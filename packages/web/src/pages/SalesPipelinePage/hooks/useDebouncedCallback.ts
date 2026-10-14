import { useLatestCallback } from '@pipeline/shared';
import { useRef } from 'react';

export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): ((...args: Args) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useLatestCallback(callback);
  return useLatestCallback((...args: Args) => {
    if (timer.current) clearTimeout(timer.current);
    if (delayMs <= 0) {
      latest(...args);
      return;
    }
    timer.current = setTimeout(() => {
      latest(...args);
    }, delayMs);
  });
};

import { useCallback, useLayoutEffect, useRef } from 'react';

export const useLatestCallback = <Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): ((...args: Args) => Result) => {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
};

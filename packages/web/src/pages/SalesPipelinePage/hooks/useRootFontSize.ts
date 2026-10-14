import { useSyncExternalStore } from 'react';

import { BASE_FONT_PX } from '@/constants/pipeline';

const subscribe = (listener: () => void) => {
  window.addEventListener('resize', listener);
  return () => {
    window.removeEventListener('resize', listener);
  };
};

const readRootFontPx = (): number => {
  const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) ? size : BASE_FONT_PX;
};

export const useRootFontSize = (): number => useSyncExternalStore(subscribe, readRootFontPx);

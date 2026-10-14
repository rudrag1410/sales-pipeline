const isApplePlatform = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent);

export const MODIFIER_KEY_LABEL = isApplePlatform() ? '⌘' : 'Ctrl';

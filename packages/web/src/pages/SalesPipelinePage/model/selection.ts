import type { Selection } from '@/types/view';
export const EMPTY_SELECTION: Selection = new Set();

export const toggleSelected = (selection: Selection, id: string): Selection => {
  const next = new Set(selection);
  if (!next.delete(id)) next.add(id);
  return next;
};

export const addSelected = (selection: Selection, ids: ReadonlyArray<string>): Selection =>
  new Set([...selection, ...ids]);

export const removeSelected = (selection: Selection, ids: ReadonlyArray<string>): Selection => {
  const next = new Set(selection);
  ids.forEach((id) => next.delete(id));
  return next;
};

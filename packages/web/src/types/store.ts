import type { QueryClient } from '@tanstack/react-query';

import type { SaveStatus } from '@/constants/enums';
import type { DealSaver } from '@/data/deal-saver';
import type { DealsStore } from '@/data/deals-store';
import type { FakeApi } from '@/data/fake-api';

import type { SimulationConfig, UpdateItem } from './api';
import type { Deal, DealId, DealPatch } from './deal';

export interface DealChange {
  dealId: DealId;
  patch: DealPatch;
}

export interface SaveState {
  status: SaveStatus;
  patch: DealPatch;
  before: Deal;
  message?: string;
  theirs?: Deal;
}

export interface EditResult {
  send: UpdateItem[];
  refused: ReadonlyArray<{ dealId: DealId; message: string; busy: boolean }>;
}

export interface Services {
  store: DealsStore;
  api: FakeApi;
  saver: DealSaver;
  queryClient: QueryClient;
}

export interface ServiceOptions {
  deals?: ReadonlyArray<Deal>;
  config?: Partial<SimulationConfig>;
  useSavedConfig?: boolean;
}

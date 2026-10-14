import { QueryClient } from '@tanstack/react-query';

import { DATASET_SIZE, DEFAULT_SEED } from '@/constants/pipeline';
import type { SimulationConfig } from '@/types/api';
import type { ServiceOptions, Services } from '@/types/store';

import { DealSaver } from './deal-saver';
import { DealsStore } from './deals-store';
import { DEFAULT_SIMULATION, FakeApi } from './fake-api';
import { generateDeals } from './seed-data';

const STORAGE_KEY = 'pipeline.simulation.v2';

const loadSavedConfig = (): Partial<SimulationConfig> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { online: _online, ...saved } = JSON.parse(raw) as Partial<SimulationConfig>;
    return saved;
  } catch {
    return {};
  }
};

export const saveConfig = (config: SimulationConfig) => {
  try {
    const { online: _online, ...persisted } = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    return;
  }
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

export const createServices = ({
  deals,
  config,
  useSavedConfig = false,
}: ServiceOptions = {}): Services => {
  const store = new DealsStore();
  const api = new FakeApi(
    () => deals ?? generateDeals(DATASET_SIZE, DEFAULT_SEED),
    store.owners,
    { ...DEFAULT_SIMULATION, ...(useSavedConfig ? loadSavedConfig() : {}), ...config },
    store.now,
  );
  if (deals) store.load(deals);
  const queryClient = createQueryClient();
  return { store, api, queryClient, saver: new DealSaver(store, api, queryClient) };
};

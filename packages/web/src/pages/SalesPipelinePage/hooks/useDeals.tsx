import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useStore } from 'zustand';

import type { DealSaver } from '@/data/deal-saver';
import type { DealsStore } from '@/data/deals-store';
import type { FakeApi } from '@/data/fake-api';
import { createServices } from '@/data/services';
import type { SimulationConfig } from '@/types/api';
import type { Deal, DealId, Owner } from '@/types/deal';
import type { SaveState, Services } from '@/types/store';

const ServicesContext = createContext<Services | null>(null);

export const DealsProvider = ({
  services: provided,
  children,
}: {
  services?: Services;
  children: ReactNode;
}) => {
  const [services] = useState(() => provided ?? createServices({ useSavedConfig: true }));
  useEffect(() => services.saver.connect(), [services]);
  return (
    <QueryClientProvider client={services.queryClient}>
      <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
    </QueryClientProvider>
  );
};

const useServices = (): Services => {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('Deals hooks must be used within DealsProvider');
  return services;
};

export const useDealsStore = (): DealsStore => useServices().store;
export const useDealSaver = (): DealSaver => useServices().saver;
export const useFakeApi = (): FakeApi => useServices().api;

export const useDeals = (): ReadonlyMap<DealId, Deal> => {
  const store = useDealsStore();
  return useStore(store.zustand, (state) => state.deals);
};

export const useDeal = (id: DealId | null): Deal | undefined => {
  const store = useDealsStore();
  useStore(store.zustand, (state) => state.deals);
  return id ? store.get(id) : undefined;
};

export const useSaveStates = (): ReadonlyMap<DealId, SaveState> => {
  const store = useDealsStore();
  return useStore(store.zustand, (state) => state.saveStates);
};

export const useRemoteMarks = (): ReadonlyMap<DealId, string> => {
  const store = useDealsStore();
  return useStore(store.zustand, (state) => state.remoteMarks);
};

export const useSimulation = (): SimulationConfig => {
  const api = useFakeApi();
  return useSyncExternalStore(api.subscribeConfig, api.getConfig);
};

export const useOwners = (): { owners: ReadonlyArray<Owner>; nameOf: (id: string) => string } => {
  const store = useDealsStore();
  return useMemo(() => {
    const names = new Map(store.owners.map((owner) => [owner.id, owner.name]));
    return { owners: store.owners, nameOf: (id: string) => names.get(id) ?? id };
  }, [store]);
};

import { ToastProvider } from '@pipeline/shared';
import { NuqsAdapter } from 'nuqs/adapters/react';

import SalesPipelinePage from '@/pages/SalesPipelinePage';
import { DealsProvider } from '@/pages/SalesPipelinePage/hooks/useDeals';
import type { Services } from '@/types/store';

export const App = ({ services }: { services?: Services }) => (
  <NuqsAdapter>
    <ToastProvider>
      <DealsProvider {...(services ? { services } : {})}>
        <SalesPipelinePage />
      </DealsProvider>
    </ToastProvider>
  </NuqsAdapter>
);

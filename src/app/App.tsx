import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import type { AppServices } from './composition';
import { ServicesProvider } from './providers/ServicesProvider';
import { routes } from './routes';

export function App({ services }: { services: AppServices }) {
  const [router] = useState(() => createBrowserRouter(routes));
  return (
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
    </ServicesProvider>
  );
}

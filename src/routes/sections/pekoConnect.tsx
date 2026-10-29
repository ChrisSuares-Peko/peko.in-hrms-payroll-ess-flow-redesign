import { lazy } from 'react';

const Pekoconnects = lazy(() => import('@src/domains/dashboard/pekoConnect/pages/PekoConnect'));

export const pekoConnectRoutes = [{ element: <Pekoconnects />, index: true }];

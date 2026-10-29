import { lazy } from 'react';

const PekoCredit = lazy(() => import('@src/domains/dashboard/PekoCredits/Pages/PekoCredit'));

export const pekoCreditRoutes = [{ element: <PekoCredit />, index: true }];

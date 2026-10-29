import { lazy } from 'react';

import { paths } from '../paths';

const Dashboard = lazy(() => import('@src/domains/dashboard/pekoPos/pages/Dashboard'));
const PlansPage = lazy(() => import('@src/domains/dashboard/pekoPos/pages/PlansPage'));
const PaymentSuccess = lazy(
    () => import('@src/domains/dashboard/pekoPos/pages/PaymentSuccessPage')
);

export const pekoPosRoutes = [
    { element: <Dashboard />, index: true },
    { element: <PlansPage />, path: paths.pekoPos.plan },
    { element: <PaymentSuccess />, path: paths.pekoPos.paymentsuccess },
];

import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const PayoutActivation = lazy(() => import('@src/domains/dashboard/Payouts/Pages/PayoutActivation'));
const PaymentDashboard = lazy(() => import('@src/domains/dashboard/Payouts/Pages/PayoutDashboard'));
const BillPayoutPage = lazy(() => import('@src/domains/dashboard/Payouts/Pages/BillPayoutPage'));
const AllPayoutsPage = lazy(() => import('@src/domains/dashboard/Payouts/Pages/AllPayoutsPage'));

export const payoutRoutes = [
    { element: <Navigate to="onboarding" replace />, index: true },
    { element: <PayoutActivation />, path: 'onboarding' },
    { element: <PaymentDashboard />, path: 'dashboard' },
    { element: <BillPayoutPage />, path: 'bill-payout' },
    { element: <AllPayoutsPage />, path: 'all-payouts' },
];
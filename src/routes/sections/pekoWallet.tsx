import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/pekoWallet/pages/PekoWallet'));
const SuccessPage = lazy(() => import('@src/domains/dashboard/pekoWallet/pages/PaymentSuccess'));
const HistoryPage = lazy(() => import('@src/domains/dashboard/pekoWallet/pages/History'));
const FailurePage = lazy(() => import('@src/domains/dashboard/pekoWallet/pages/PaymentFailure'));

// -----------------------------------------------------------------------

export const PekoWalletRoutes = [
    { element: <HomePage />, index: true },
    {
        element: <SuccessPage />,
        path: `${paths.pekoWallet.paymentsuccess}`,
    },
    {
        element: <FailurePage />,
        path: `${paths.pekoWallet.paymentFailure}`,
    },
    {
        element: <HistoryPage />,
        path: paths.pekoWallet.transactionHistory,
    },
];

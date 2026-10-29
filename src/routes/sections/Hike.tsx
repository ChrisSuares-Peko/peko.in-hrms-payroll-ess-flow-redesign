import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/Hike/pages/HomePage'));
const PurchasePage = lazy(() => import('@src/domains/dashboard/Hike/pages/PurchasePage'));
const CheckoutPage = lazy(() => import('@src/domains/dashboard/Hike/pages/CheckoutPage'));
const HistoryPage = lazy(() => import('@src/domains/dashboard/Hike/pages/HistoryPage'));
// -----------------------------------------------------------------------

export const HikeRoutes = [
    { element: <HomePage />, index: true },
    {
        element: <PurchasePage />,
        path: paths.hike.purchasePage,
    },
    {
        element: <CheckoutPage />,
        path: `${paths.hike.purchasePage}/${paths.hike.checkoutPage}`,
    },
    {
        element: <HistoryPage />,
        path: paths.hike.historyPage,
    },
];

import { lazy } from 'react';

import { paths } from '../paths';

const WorksPage = lazy(() => import('@src/domains/dashboard/Works/pages/WorksList'));
const WorkDetail = lazy(() => import('@src/domains/dashboard/Works/pages/WorkDetail'));
const WorkPurchased = lazy(() => import('@src/domains/dashboard/Works/pages/WorkPurchased'));
const ReviewPage = lazy(() => import('@src/domains/dashboard/Works/pages/ReviewPage'));
const OrderHistoryPage = lazy(() => import('@src/domains/dashboard/Works/pages/OrderHistoryPage'));
const OrderDetailsPage = lazy(() => import('@src/domains/dashboard/Works/pages/OrderDetailsPage'));

export const workRoutes = [
    { element: <WorksPage />, index: true },
    { element: <WorkDetail />, path: `${paths.works.detail}/${paths.works.id}` },
    {
        element: <ReviewPage />,
        path: `${paths.works.detail}/${paths.works.id}/${paths.works.purchase}/${paths.works.planId}`,
    },
    { element: <OrderHistoryPage />, path: paths.works.orderHistory },
    {
        element: <OrderDetailsPage />,
        path: `${paths.works.orderHistory}/${paths.works.orderDetails}/${paths.works.id}`,
    },
    { element: <WorkPurchased />, path: paths.works.purchased },
];

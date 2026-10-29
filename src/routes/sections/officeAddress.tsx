import { lazy } from 'react';

import { paths } from '../paths';

const OfficeAddressPage = lazy(
    () => import('@src/domains/dashboard/OfficeAddress/pages/OfficeAddress')
);

const PlanDetailPage = lazy(
    () => import('@src/domains/dashboard/OfficeAddress/pages/PlanDetailPage')
);
const BasicPlanPage = lazy(() => import('@src/domains/dashboard/OfficeAddress/pages/Basic'));
const PremiumPlanPage = lazy(() => import('@src/domains/dashboard/OfficeAddress/pages/Premium'));
const FlexiPlanPage = lazy(() => import('@src/domains/dashboard/OfficeAddress/pages/Flexi'));
const OrderHistory = lazy(() => import('@src/domains/dashboard/OfficeAddress/pages/OrderHistory'));
// -----------------------------------------------------------------------

export const officeAddressRoutes = [
    { element: <OfficeAddressPage />, index: true },
    { element: <PlanDetailPage />, path: paths.officeAddress.plans },
    { element: <BasicPlanPage />, path: paths.officeAddress.basic },
    { element: <PremiumPlanPage />, path: paths.officeAddress.premium },
    { element: <FlexiPlanPage />, path: paths.officeAddress.flexi },
    { element: <OrderHistory />, path: paths.officeAddress.orderhistory },
];

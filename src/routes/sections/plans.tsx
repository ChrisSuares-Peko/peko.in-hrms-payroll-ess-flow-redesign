import { lazy } from 'react';

import { paths } from '@routes/paths';

const PaymentSuccess = lazy(() => import('@src/domains/dashboard/plans/pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('@src/domains/dashboard/plans/pages/PaymentFailure'));
const PlanLandingPage = lazy(() => import('@src/domains/dashboard/plans/pages/PlanLandingPage'));
const ReviewOrder = lazy(() => import('@src/domains/dashboard/plans/pages/ReviewOrder'));
const SubscriptionPendingPage = lazy(
    () => import('@src/domains/dashboard/payments/pages/SubscriptionPendingPage')
);

export const planRoutes = [
    { element: <PlanLandingPage />, index: true },
    { element: <ReviewOrder />, path: paths.plans.reviewOrder },
    { element: <PaymentSuccess />, path: paths.plans.paymentsuccess },
    { element: <SubscriptionPendingPage />, path: paths.plans.paymentPending },
    { element: <PaymentFailure />, path: paths.plans.paymentFailure },
];

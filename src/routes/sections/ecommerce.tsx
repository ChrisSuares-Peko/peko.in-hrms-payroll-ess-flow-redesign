import { lazy } from 'react';

import { paths } from '../paths';

const Dashboard = lazy(() => import('@src/domains/dashboard/eCommerce/pages/Dashboard'));
const LandingPage2 = lazy(() => import('@src/domains/dashboard/eCommerce/components/LandingPage2'));
const BillingHistoryPage = lazy(
    () => import('@src/domains/dashboard/eCommerce/pages/BillingHistoryPage')
);
const PaymentSuccess = lazy(
    () => import('@src/domains/dashboard/eCommerce/pages/PaymentSuccessPage')
);

export const ecommerceRoutes = [
    { element: <Dashboard />, index: true },
    { element: <LandingPage2 />, path: paths.ecommerce.plan },
    { element: <BillingHistoryPage />, path: paths.ecommerce.reviewOrder },
    { element: <PaymentSuccess />, path: paths.ecommerce.paymentsuccess },
];

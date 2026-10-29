import { lazy } from 'react';

import { paths } from '../paths';

const TelecomPaymentsList = lazy(
    () => import('@src/domains/dashboard/telecomPayments/pages/TelecomPaymentsList')
);
const Prepaid = lazy(() => import('@src/domains/dashboard/telecomPayments/pages/Prepaid'));
const Postpaid = lazy(() => import('@src/domains/dashboard/telecomPayments/pages/Postpaid'));
const Test = lazy(() => import('@src/domains/dashboard/telecomPayments/pages/Test'));

// -----------------------------------------------------------------------

export const telecomPaymentsRoutes = [
    { element: <TelecomPaymentsList />, index: true },
    { element: <Prepaid />, path: paths.telecomPayments.prepaid },
    { element: <Postpaid />, path: paths.telecomPayments.postpaid },
    { element: <Test />, path: paths.telecomPayments.test },
];

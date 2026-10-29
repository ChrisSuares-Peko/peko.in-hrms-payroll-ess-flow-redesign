import { lazy } from 'react';

import { paths } from '../paths';

const PaytmBPOS = lazy(() => import('@domains/dashboard/PaytmBPOS/pages/PaytmBPOS'));
const RequestDemo = lazy(() => import('@domains/dashboard/PaytmBPOS/pages/RequestDemo'));
const RequestSuccess = lazy(() => import('@domains/dashboard/PaytmBPOS/pages/RequestSuccess'));
const OrderHistory = lazy(() => import('@domains/dashboard/PaytmBPOS/pages/OrderHistory'));

export const paytmBposRoutes = [
    { element: <PaytmBPOS />, index: true },
    { element: <RequestDemo />, path: paths.paytmBpos.request },
    { element: <RequestSuccess />, path: paths.paytmBpos.submitted },
    { element: <OrderHistory />, path: paths.paytmBpos.orderHistory },
];

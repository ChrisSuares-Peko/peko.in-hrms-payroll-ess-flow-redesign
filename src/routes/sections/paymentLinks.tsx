import { lazy } from 'react';

import { paths } from '../paths';

const PaymentLinkLanding = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/PaymentLinkLanding')
);
const CreatePaymentLink = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/CreatePaymentLink')
);
const Transactions = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/Transactions')
);
const TransactionDetail = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/TransactionDetail')
);
const VirtualAccountStatement = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/VirtualAccountStatement')
);
const ENachMandates = lazy(
    () => import('@src/domains/dashboard/paymentLinks/pages/ENachMandates')
);

// -----------------------------------------------------------------------

export const paymentLinkRoutes = [
    { element: <PaymentLinkLanding />, index: true },
    { element: <CreatePaymentLink />, path: paths.paymentLinks.CreatePayment },
    { element: <ENachMandates />, path: paths.paymentLinks.ENachMandates },
    { element: <Transactions />, path: paths.paymentLinks.Transactions },
    { element: <TransactionDetail />, path: paths.paymentLinks.TransactionDetail },
    { element: <VirtualAccountStatement />, path: paths.paymentLinks.VirtualAccountStatement },
];

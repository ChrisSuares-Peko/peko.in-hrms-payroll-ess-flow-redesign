import { lazy } from 'react';

import BillPaymentPage from '@src/domains/dashboard/billPayments/pages/BillPaymentPage';
import { billPayments } from '@src/domains/dashboard/billPayments/utils/data';

import { paths } from '../paths';

const BillPaymentsList = lazy(
    () => import('@src/domains/dashboard/billPayments/pages/BillPaymentsList')
);
const ComplaintRegistration = lazy(
    () => import('@src/domains/dashboard/billPayments/pages/ComplaintRegistration')
);
const Register = lazy(() => import('@src/domains/dashboard/billPayments/pages/RegistrationForm'));
const BulkPayReviewPage = lazy(
    () => import('@src/domains/dashboard/billPayments/components/BulkPayReview')
);
const SuccessPage = lazy(() => import('@domains/dashboard/billPayments/pages/ComplaintSuccess'));
const BillChallanPage = lazy(() => import('@src/domains/dashboard/challan/pages/BillChallanPage'));
const ChallanOrderHistory = lazy(
    () => import('@src/domains/dashboard/challan/pages/ChallanOrderHistoryPage')
);

// -----------------------------------------------------------------------

// Challan has its own (non-BBPS) flow, so it gets a custom route instead of the
// auto-generated BillPaymentPage.
const allBillServices = [
    ...billPayments.filter(
        s => s.url !== paths.telecomPayments.test && s.url !== paths.billPayments.challan
    ),
];

export const billPaymentRoutes = [
    { element: <BillPaymentsList />, index: true },
    { element: <BillChallanPage />, path: paths.billPayments.challan },
    {
        element: <ChallanOrderHistory />,
        path: `${paths.billPayments.challan}/${paths.billPayments.challanOrders}`,
    },
    ...allBillServices.map(service => ({
        element: (
            <BillPaymentPage
                title={service.title}
                accessKeyName={service.accessKey}
                serviceCategory={service.BBPSCategoryName}
            />
        ),
        path: service.url,
    })),
    { element: <ComplaintRegistration />, path: paths.billPayments.complaintRegistration },
    {
        element: <Register />,
        path: `${paths.billPayments.complaintRegistration}/${paths.billPayments.ComplaintRegister}`,
    },
    {
        element: <SuccessPage />,
        path: `${paths.billPayments.complaintRegistration}/${paths.billPayments.success}`,
    },
    {
        element: <BulkPayReviewPage />,
        path: `${paths.billPayments.electricity}/${paths.billPayments.bulkPayment}`,
    },
];

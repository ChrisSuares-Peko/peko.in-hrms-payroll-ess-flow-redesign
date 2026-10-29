import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/verificationSuite/pages/HomePage'));

const HistoryPage = lazy(
    () => import('@src/domains/dashboard/verificationSuite/pages/VerificationHistory')
);
const DetailsPage = lazy(() => import('@src/domains/dashboard/verificationSuite/pages/Details'));
const SettingsPage = lazy(
    () => import('@src/domains/dashboard/verificationSuite/pages/SettingsPage')
);
const ReviewOrderPage = lazy(
    () => import('@src/domains/dashboard/verificationSuite/pages/ReviewOrder')
);
const PaymentSuccessPage = lazy(
    () => import('@src/domains/dashboard/verificationSuite/pages/PaymentSuccessPage')
);
const PaymentFailurePage = lazy(
    () => import('@src/domains/dashboard/verificationSuite/pages/PaymentFailurePage')
);

// -----------------------------------------------------------------------

export const verificationSuiteRoutes = [
    { element: <HomePage />, index: true },

    {
        element: <HistoryPage />,
        path: paths.verificationSuite.verificationHistory,
    },
    {
        element: <DetailsPage />,
        path: `${paths.verificationSuite.verificationHistory}/${paths.verificationSuite.verificationDetails}`,
    },
    {
        element: <SettingsPage />,
        path: paths.verificationSuite.settings,
    },
    {
        element: <ReviewOrderPage />,
        path: paths.verificationSuite.reviewOrder,
    },
    {
        element: <PaymentSuccessPage />,
        path: paths.payments.paymentsuccess,
    },
    {
        element: <PaymentFailurePage />,
        path: paths.payments.paymentFailure,
    },
];

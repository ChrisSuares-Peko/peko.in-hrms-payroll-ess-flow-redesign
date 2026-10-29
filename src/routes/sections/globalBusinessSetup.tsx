import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/globalBusinessSetup/pages/Home'));
const GetStarted = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/GetStarted')
);
const NewSetup = lazy(() => import('@src/domains/dashboard/globalBusinessSetup/pages/NewSetup'));
const EditSetup = lazy(() => import('@src/domains/dashboard/globalBusinessSetup/pages/EditSetup'));
const ReviewPage = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/ReviewPage')
);
const PaymentSummary = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/paymentSummary')
);
const IntialReviewPage = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/IntialReviewPage')
);
const GetQuote = lazy(() => import('@src/domains/dashboard/globalBusinessSetup/pages/GetQuote'));
const QuoteDetails = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/QuoteDetails')
);
const OngoingSetups = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/OngoingSetups')
);
const Renewals = lazy(() => import('@src/domains/dashboard/globalBusinessSetup/pages/Renewals'));
const RenewalDetail = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/RenewalDetail')
);
const PendingHistory = lazy(
    () => import('@src/domains/dashboard/globalBusinessSetup/pages/PendingApplications')
);

export const GlobalBusinessSetupRoutes = [
    { element: <HomePage />, index: true },
    { element: <GetQuote />, path: paths.globalBusinessSetup.getQuote },
    {
        element: <QuoteDetails />,
        path: `${paths.globalBusinessSetup.getQuote}/${paths.globalBusinessSetup.details}`,
    },
    { element: <OngoingSetups />, path: paths.globalBusinessSetup.ongoingSetups },
    { element: <Renewals />, path: paths.globalBusinessSetup.renewals },
    {
        element: <RenewalDetail />,
        path: `${paths.globalBusinessSetup.renewals}/${paths.globalBusinessSetup.viewRequest}/:id`,
    },
    { element: <GetStarted />, path: paths.globalBusinessSetup.getStarted },
    {
        element: <NewSetup />,
        path: `${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.new}`,
    },
    {
        element: <EditSetup />,
        path: `${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}/${paths.globalBusinessSetup.edit}/:id`,
    },
    {
        element: <ReviewPage />,
        path: `${paths.globalBusinessSetup.ongoingSetups}/${paths.globalBusinessSetup.viewRequest}/:id`,
    },
    {
        element: <PendingHistory />,
        path: `${paths.globalBusinessSetup.getStarted}/${paths.globalBusinessSetup.pendingApplications}`,
    },
    {
        element: <IntialReviewPage />,
        path: paths.globalBusinessSetup.review,
    },
    {
        element: <PaymentSummary />,
        path: `${paths.globalBusinessSetup.review}/${paths.globalBusinessSetup.paymentsummary}/:id`,
    },
    {
        element: <ReviewPage />,
        path: `${paths.globalBusinessSetup.getStarted}/:type/${paths.globalBusinessSetup.viewRequest}/:id`,
    },
];

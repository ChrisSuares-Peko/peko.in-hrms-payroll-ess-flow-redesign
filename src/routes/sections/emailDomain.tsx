import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/emailDomain/pages/HomePage'));
const DetailsPage = lazy(() => import('@src/domains/dashboard/emailDomain/pages/DetailsPage'));
const EmailDomainHistory = lazy(() => import('@src/domains/dashboard/emailDomain/pages/History'));

// -----------------------------------------------------------------------

export const emailDomainRoutes = [
    { element: <HomePage />, index: true },
    {
        element: <DetailsPage />,
        path: paths.emailDomain.detailsPage,
    },
    {
        element: <EmailDomainHistory />,
        path: paths.emailDomain.historyPage,
    },
    {
        element: <EmailDomainHistory />,
        path: `${paths.emailDomain.detailsPage}/${paths.emailDomain.historyPage}`, // for dynamic product name in breadcrums
    },
];

import { lazy } from 'react';

import { paths } from '../paths';

const LandingPage = lazy(() => import('@src/domains/dashboard/eSign/pages/LandingPage'));
const HistoryPage = lazy(() => import('@src/domains/dashboard/eSign/pages/HistoryPage'));
const SuccessPage = lazy(() => import('@src/domains/dashboard/eSign/pages/SuccessPage'));
const UploadPage = lazy(() => import('@src/domains/dashboard/eSign/pages/UploadPage'));
const ViewPage = lazy(() => import('@src/domains/dashboard/eSign/pages/ViewPage'));
const SettingsPage = lazy(() => import('@src/domains/dashboard/eSign/pages/SettingsPage'));

export const eSignRoutes = [
    { element: <LandingPage />, index: true },
    { element: <ViewPage />, path: `${paths.eSign.viewPage}` },

    { element: <UploadPage />, path: paths.eSign.uploadPage },
    { element: <ViewPage />, path: `${paths.eSign.uploadPage}/${paths.eSign.viewPage}` },

    { element: <SettingsPage />, path: paths.eSign.settings },
    {
        element: <SuccessPage />,
        path: `${paths.eSign.successPage}`,
    },

    {
        path: paths.eSign.historyPage,
        children: [
            { element: <HistoryPage />, index: true },
            { element: <ViewPage />, path: paths.eSign.viewPage }, // for admin
        ],
    },
];

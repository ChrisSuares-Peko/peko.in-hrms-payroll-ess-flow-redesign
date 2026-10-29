import { lazy } from 'react';

import { paths } from '@routes/paths';

const Connect = lazy(() => import('@domains/dashboard/Connect/pages/Connect'));
const ConnectDetail = lazy(() => import('@domains/dashboard/Connect/pages/ConnectDetail'));
const ConnectSuccess = lazy(() => import('@domains/dashboard/Connect/pages/ConnectSuccess'));
const ConnectFailed = lazy(() => import('@domains/dashboard/Connect/pages/ConnectFailed'));

export const connectRoutes = [
    { element: <Connect />, index: true },
    {
        element: <ConnectDetail />,
        path: paths.connect.details,
    },
    {
        element: <ConnectSuccess />,
        path: paths.connect.success,
    },
    {
        element: <ConnectFailed />,
        path: paths.connect.failed,
    },
];

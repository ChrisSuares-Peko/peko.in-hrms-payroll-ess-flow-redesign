import { lazy } from 'react';

import { paths } from '../paths';

const ProfilePage = lazy(() => import('@src/domains/dashboard/profile/pages/Profile'));
const OneKyb = lazy(() => import('@src/domains/dashboard/profile/pages/Kyb'));
// -----------------------------------------------------------------------

export const profileRoutes = [
    { element: <ProfilePage />, index: true },
    {
        element: <OneKyb />,
        path: paths.profile.kyb,
    },
];

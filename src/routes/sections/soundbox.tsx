import { lazy } from 'react';

import { paths } from '../paths';

const SoundboxListing = lazy(() => import('@domains/dashboard/soundbox/pages/SoundboxListing'));
const SoundboxOrderDetails = lazy(
    () => import('@domains/dashboard/soundbox/pages/SoundboxOrderDetails')
);
const SoundboxDetailsPage = lazy(
    () => import('@domains/dashboard/soundbox/pages/SoundboxDetailedView')
);

export const soundBoxRoutes = [
    { element: <SoundboxListing />, index: true },
    { element: <SoundboxOrderDetails />, path: paths.soundbox.orderDetails },
    { element: <SoundboxDetailsPage />, path: paths.soundbox.details },
];

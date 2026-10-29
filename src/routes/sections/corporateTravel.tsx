import { lazy } from 'react';

import { airlineRoutes } from './airline';
import { busRoutes } from './bus';
import { esimRoutes } from './esim';
import { hotelsRoutes } from './hotels';
import { visaRoutes } from './visa';
import { paths } from '../paths';

const CorporateTravel = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/CorporateTravel')
);

export const corporateTravelRoutes = [
    {
        element: <CorporateTravel />,
        path: paths.dashboard.corporateTravel,
    },
    {
        path: paths.airline.index,
        children: airlineRoutes,
    },
    {
        path: paths.hotels.index,
        children: hotelsRoutes,
    },
    {
        path: paths.esim.index,
        children: esimRoutes,
    },
    {
        path: paths.visa.index,
        children: visaRoutes,
    },
    {
        path: paths.bus.index,
        children: busRoutes,
    },
];

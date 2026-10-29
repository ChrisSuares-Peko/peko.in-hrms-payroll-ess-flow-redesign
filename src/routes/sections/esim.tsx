import { lazy } from 'react';

// import { Navigate } from 'react-router-dom';

import { paths } from '../paths';

const Result = lazy(() => import('@src/domains/dashboard/esim/pages/Result'));
const Details = lazy(() => import('@src/domains/dashboard/esim/pages/Details'));
const Orders = lazy(() => import('@src/domains/dashboard/esim/pages/Orders'));
const EsimDetails = lazy(() => import('@src/domains/dashboard/esim/pages/EsimDetails'));
const TopUp = lazy(() => import('@src/domains/dashboard/esim/pages/TopUp'));
const HowEsim = lazy(() => import('@src/domains/dashboard/esim/pages/HowEsim'));
const ReplacePackage = lazy(() => import('@src/domains/dashboard/esim/pages/ReplacePackage'));
const Home = lazy(() => import('@src/domains/dashboard/esim/pages/Home'));

export const esimRoutes = [
    // { element: <Navigate to={paths.dashboard.corporateTravel} replace />, index: true },
    { element: <Home />, index: true },
    {
        element: <Result />,
        path: paths.esim.packages,
    },
    { element: <Details />, path: `${paths.esim.packages}/${paths.esim.details}` },
    { element: <Orders />, path: `${paths.esim.orders}` },
    { element: <EsimDetails />, path: `${paths.esim.orders}/${paths.esim.esimDetails}` },
    { element: <ReplacePackage />, path: `${paths.esim.packages}/${paths.esim.ReplacePackage}` },
    {
        element: <TopUp />,
        path: `${paths.esim.orders}/${paths.esim.esimDetails}/${paths.esim.topup}`,
    },
    { element: <HowEsim />, path: `${paths.esim.howEsim}` },
];

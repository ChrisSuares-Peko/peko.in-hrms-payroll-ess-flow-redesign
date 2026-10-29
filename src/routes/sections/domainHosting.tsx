import { lazy } from 'react';

import { paths } from '../paths';

const LandingPage = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/LandingPage'));
const Cart = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/Cart'));
const VpsServer = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/VpsServer'));
const VpsServerDetail = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/VpsServerDetail'));
const SharedHosting = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/SharedHosting'));
const SharedHostingDetail = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/SharedHostingDetail'));
const GoogleWorkspace = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/GoogleWorkspace'));
const GoogleWorkspaceDetail = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/GoogleWorkspaceDetail'));
const TitanEmailPage = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/TitanEmail'));
const TitanEmailDetailPage = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/TitanEmailDetail'));
const Checkout = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/Checkout'));
const ManageSubscriptions = lazy(() => import('@src/domains/dashboard/Domain & Hosting/pages/ManageSubscription'));

// -----------------------------------------------------------------------

export const domainHostingRoutes = [
    { element: <LandingPage />, index: true },
    {
        element: <Cart />,
        path: paths.domainHosting.cart,
    },
    {
        element: <Checkout />,
        path: paths.domainHosting.checkout,
    },
    {
        element: <VpsServer />,
        path: paths.domainHosting.vpsServer,
    },
    {
        element: <VpsServerDetail />,
        path: paths.domainHosting.vpsServerDetail,
    },
    {
        element: <SharedHosting />,
        path: paths.domainHosting.sharedHosting,
    },
    {
        element: <SharedHostingDetail />,
        path: paths.domainHosting.sharedHostingDetail,
    },
    {
        element: <GoogleWorkspace />,
        path: paths.domainHosting.googleWorkspace,
    },
    {
        element: <GoogleWorkspaceDetail />,
        path: paths.domainHosting.googleWorkspaceDetail,
    },
    {
        element: <TitanEmailPage />,
        path: paths.domainHosting.titanEmail,
    },
    {
        element: <TitanEmailDetailPage />,
        path: paths.domainHosting.titanEmailDetail,
    },
    {
        element: <ManageSubscriptions />,
        path: paths.domainHosting.manageSubscription,
    },
];

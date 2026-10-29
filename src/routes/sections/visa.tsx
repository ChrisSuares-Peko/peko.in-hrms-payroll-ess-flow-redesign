import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

import { paths } from '../paths';

const VisaResults = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/VisaResults')
);

const TravellerDetails = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/TravellerDetails')
);

const VisaPayment = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/VisaPayment')
);

const VisaPaymentSuccess = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/VisaPaymentSuccess')
);

const VisaTrackApplication = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/VisaTrackApplication')
);

const VisaManageBookings = lazy(
    () => import('@domains/dashboard/CorporateTravel/pages/VisaManageBookings')
);

export const visaRoutes = [
    {
        index: true,
        element: <Navigate to={paths.dashboard.corporateTravel} state={{ initialActiveTab: '4' }} replace />,
    },
    {
        path: paths.visa.results,
        element: <VisaResults />,
    },
    {
        path: paths.visa.travellerDetails,
        element: <TravellerDetails />,
    },
    {
        path: paths.visa.visaPayment,
        element: <VisaPayment />,
    },
    {
        path: paths.visa.visaSuccess,
        element: <VisaPaymentSuccess />,
    },
    {
        path: paths.visa.visaTracking,
        element: <VisaTrackApplication />,
    },
    {
        path: paths.visa.visaTrackingDetail,
        element: <VisaTrackApplication />,
    },
    {
        path: paths.visa.manageBookings,
        element: <VisaManageBookings />,
    },
];

import { lazy } from 'react';

const ExploreServices = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/ExploreServices')
);

const ServiceDetail = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/ServiceDetail')
);

const MyApplications = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/MyApplications')
);

const ApplicationForm = lazy(
    () => import('@domains/dashboard/GovernmentServices/pages/ApplicationForm')
);

const TrademarkRegistrationForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/TrademarkRegistrationForm')
);

const TrademarkObjectionForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/TrademarkObjectionForm')
);

const GstRegistrationForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/GstRegistrationForm')
);

const GstCancellationForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/GstCancellationForm')
);

const ExpeditedTrademarkRegistrationForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/ExpeditedTrademarkRegistrationForm')
);

const IecRegistrationForm = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/IecRegistrationForm')
);

const TrackingPage = lazy(
    () => import('@domains/dashboard/GovernmentServicesV2/pages/TrackingPage')
);

const SuccessPage = lazy(() => import('@domains/dashboard/GovernmentServices/pages/SuccessPage'));

const ApplicationTracking = lazy(
    () => import('@domains/dashboard/GovernmentServices/pages/ApplicationTracking')
);

export const governmentServicesRoutes = [
    { element: <ExploreServices />, index: true },
    { path: 'explore', element: <ExploreServices /> },
    { path: 'applications', element: <MyApplications /> },
    { path: 'service/:serviceId', element: <ServiceDetail /> },
    { path: 'service/:serviceId/apply', element: <ApplicationForm /> },
    { path: 'service/:serviceId/register', element: <TrademarkRegistrationForm /> },
    { path: 'service/:serviceId/objection', element: <TrademarkObjectionForm /> },
    { path: 'service/:serviceId/gst-register', element: <GstRegistrationForm /> },
    { path: 'service/:serviceId/cancellation', element: <GstCancellationForm /> },
    { path: 'service/:serviceId/expedited', element: <ExpeditedTrademarkRegistrationForm /> },
    { path: 'service/:serviceId/iec', element: <IecRegistrationForm /> },
    { path: 'tracking', element: <TrackingPage /> },
    { path: 'service/:serviceId/success', element: <SuccessPage /> },
    { path: 'application/:applicationId', element: <ApplicationTracking /> },
];

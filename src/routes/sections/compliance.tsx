import { lazy } from 'react';


const ComplianceDashboard = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/Dashboard')
);

const LandingPage = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/LandingPage')
);

const ComplianceOnboarding = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ComplianceOnboarding')
);

const IncorporationRedirect = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/IncorporationRedirect')
);

const CompanyIdentification = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/CompanyIdentification')
);

const CompanyDetails = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/CompanyDetails')
);

const ConfirmCompanyDetails = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ConfirmCompanyDetails')
);

const ComplianceHealth = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ComplianceHealth')
);

const ComplianceDetail = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ComplianceDetail')
);

const Documents = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/Documents')
);

const MyCompliances = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/MyCompliances')
);

const ComplianceTracker = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ComplianceTracker')
);

const ComplianceCompletedView = lazy(
    () => import('@src/domains/dashboard/Compliance/pages/ComplianceCompletedView')
);

export const complianceRoutes = [
    { element: <LandingPage />, index: true },
    { path: 'landing', element: <LandingPage /> },
    { path: 'dashboard', element: <ComplianceDashboard /> },
    { path: 'dashboard/health', element: <ComplianceHealth /> },
    { path: 'dashboard/health/detail/:id', element: <ComplianceDetail /> },
    { path: 'dashboard/documents', element: <Documents /> },
    { path: 'dashboard/my-compliances', element: <MyCompliances /> },
    { path: 'dashboard/my-compliances/tracker/:id', element: <ComplianceTracker /> },
    { path: 'dashboard/my-compliances/completed/:id', element: <ComplianceCompletedView /> },
    { path: 'onboarding', element: <ComplianceOnboarding /> },
    { path: 'incorporation', element: <IncorporationRedirect /> },
    { path: 'company-identify', element: <CompanyIdentification /> },
    { path: 'company-details', element: <CompanyDetails /> },
    { path: 'confirm-company-details', element: <ConfirmCompanyDetails /> },
];

import { Navigate, useRoutes } from 'react-router-dom';

import ENachMandatePublicSuccess from '@src/domains/dashboard/paymentLinks/pages/ENachMandatePublicSuccess';
import PaymentLinkPublicSuccess from '@src/domains/dashboard/paymentLinks/pages/PaymentLinkPublicSuccess';
import OnlineProposalPage from '@src/domains/dashboard/Procure/components/Proposals/OnlineProposalPage';
import OnlinePOAcknowledgePage from '@src/domains/dashboard/Procure/components/PurchaseOrderDetails/OnlinePOAcknowledgePage';
import OndcStaticTermsPage from '@src/domains/pages/OndcStaticTermsPage';
import PageNotFound from '@src/domains/pages/PageNotFound';
import { useRootPath } from '@src/hooks/useRootPath';
import { paths } from '@src/routes/paths';

import { accountingAdminRoutes } from './accountingAdmin';
import { authRoutes } from './auth';
import { dashboardRoutes } from './dashboard';
import { employeeRoutes } from './employee';
// import { planRoutes } from './plans';
import { systemUserRoutes } from './systemUser';

export default function Router() {
    const rootPath = useRootPath();
    return useRoutes([
        {
            path: '/',
            element: <Navigate to={rootPath} replace />,
        },

        // Public routes — must be before dashboardRoutes so they are not caught by the AuthGuard layout
        { path: paths.paymentLinkPublicSuccess, element: <PaymentLinkPublicSuccess /> },
        { path: paths.eNachMandatePublicSuccess, element: <ENachMandatePublicSuccess /> },
        { path: paths.rfqPublicSubmit, element: <OnlineProposalPage /> },
        { path: paths.poPublicAcknowledge, element: <OnlinePOAcknowledgePage /> },

        // Auth routes
        ...authRoutes,

        // Dashboard routes
        ...dashboardRoutes,

        // Subscription routes
        // ...planRoutes,

        // Accounting portal (system user)
        ...accountingAdminRoutes,

        // System User routes
        ...systemUserRoutes,

        // Employee (ESS) routes
        ...employeeRoutes,

        // Public ONDC Buyer NP static terms (no auth required)
        { path: paths.ondcStaticTerms, element: <OndcStaticTermsPage /> },

        // No match 404
        { path: '/404', element: <PageNotFound /> },
        { path: '*', element: <Navigate to="/404" replace /> },
    ]);
}

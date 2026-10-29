import { lazy } from 'react';

import { paths } from '../paths';

const PaymentSuccessBotBuilder = lazy(
    () => import('@src/domains/dashboard/WhatsappForBusiness/pages/PaymentSuccsessBotBuilder')
);
const BillingHistoryPage = lazy(
    () => import('@src/domains/dashboard/WhatsappForBusiness/pages/BillingHistoryPage')
);
const PaymentSuccess = lazy(
    () => import('@src/domains/dashboard/WhatsappForBusiness/pages/PaymentSuccessPage')
);

const WhatsappForBusiness = lazy(
    () => import('@src/domains/dashboard/WhatsappForBusiness/pages/HomePage')
);

const PlanDetails = lazy(
    () => import('@src/domains/dashboard/WhatsappForBusiness/pages/PlanDetails')
);

export const WhatsappForBusinessRoutes = [
    { element: <WhatsappForBusiness />, index: true },
    { element: <PlanDetails />, path: paths.whatsappForBusiness.planDetails },
    // { element: <ProjectTable />, path: paths.whatsappForBusiness.MyProjects },
    { element: <BillingHistoryPage />, path: paths.whatsappForBusiness.reviewOrder },
    { element: <PaymentSuccess />, path: paths.plans.paymentsuccess },
    { element: <PaymentSuccessBotBuilder />, path: paths.whatsappForBusiness.successPage },
];

import { lazy } from 'react';

import { paths } from '../paths';

const BuyCredits = lazy(() => import('@src/domains/dashboard/carbonFootprint/pages/BuyCredits'));
const ImpactReport = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/ImpactReport')
);
const Neutralize = lazy(() => import('@src/domains/dashboard/carbonFootprint/pages/Neutralize'));
const ProjectDetails = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/ProjectDetails')
);

const DashboardPage = lazy(() => import('@src/domains/dashboard/carbonFootprint/pages/Dashboard'));
const CarbonFormPage = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/CarbonForm')
);
const CalculatorResultPage = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/CalculatorResult')
);
const ProjectListing = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/ProjectListing')
);
const WhyActPage = lazy(() => import('@src/domains/dashboard/carbonFootprint/pages/WhyAct'));
const TransactionsPage = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/Transactions')
);
const ShareImpactPage = lazy(
    () => import('@src/domains/dashboard/carbonFootprint/pages/ShareImpact')
);

// -----------------------------------------------------------------------

export const carbonFootprintRoutes = [
    { element: <DashboardPage />, index: true },
    { element: <CarbonFormPage />, path: paths.zeroCarbon.carbonCalculator },
    {
        element: <CalculatorResultPage />,
        path: `${paths.zeroCarbon.carbonCalculator}/${paths.zeroCarbon.result}`,
    },
    {
        element: <ProjectDetails />,
        path: `${paths.zeroCarbon.projectDetails}${paths.zeroCarbon.id}`,
    },
    {
        element: <Neutralize />,
        path: `${paths.zeroCarbon.projectDetails}${paths.zeroCarbon.id}/${paths.zeroCarbon.neutralize}`,
    },
    { element: <BuyCredits />, path: paths.zeroCarbon.buyCredits },
    { element: <ImpactReport />, path: paths.zeroCarbon.impactReport },
    { element: <ProjectListing />, path: paths.zeroCarbon.projectListing },
    { element: <WhyActPage />, path: paths.zeroCarbon.whyAct },
    { element: <TransactionsPage />, path: paths.zeroCarbon.transactions },
    { element: <ShareImpactPage />, path: paths.zeroCarbon.shareImpact },
];

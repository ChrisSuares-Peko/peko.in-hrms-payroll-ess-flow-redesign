import { lazy } from 'react';

import { paths } from '../paths';

const HomePage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/HomePage'));
const TaskToDoPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/TaskToDo'));
const CompanyDocPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/CompanyDoc'));
const OwnershipDocPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/OwnershipDoc'));
const FinancialsPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/Financials'));
const EmployeeDetailsPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/EmployeeDetails')
);
const SubscriptionsPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/Subscriptions')
);
const AssetsPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/Assets'));
const AssetsDetailsPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/AssetsDetails')
);
const FleetManagementPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/FleetManagement')
);
const ChequeBookDetailsPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/ChequeBookDetails')
);
const Settings = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/Settings'));

const ChequeDetailsPage = lazy(
    () => import('@src/domains/dashboard/PekoCloud/pages/ChequeDetails')
);
const FleetDetailsPage = lazy(() => import('@src/domains/dashboard/PekoCloud/pages/Fleets'));
// -----------------------------------------------------------------------

export const pekoCloudRoutes = [
    { element: <HomePage />, index: true },
    {
        element: <Settings />,
        path: paths.pekoCloud.settings,
    },
    {
        element: <TaskToDoPage />,
        path: paths.pekoCloud.taskToDo,
    },
    {
        element: <CompanyDocPage />,
        path: paths.pekoCloud.companyDocuments,
    },
    {
        element: <OwnershipDocPage />,
        path: paths.pekoCloud.ownershipDocuments,
    },
    {
        element: <EmployeeDetailsPage />,
        path: paths.pekoCloud.employeeDetails,
    },
    {
        element: <SubscriptionsPage />,
        path: paths.pekoCloud.subscriptions,
    },
    {
        element: <AssetsPage />,
        path: paths.pekoCloud.assets,
    },
    {
        element: <AssetsDetailsPage />,
        path: `${paths.pekoCloud.assets}/${paths.pekoCloud.assetsDetails}`,
    },
    {
        element: <FleetDetailsPage />,
        path: `${paths.pekoCloud.fleet}/${paths.pekoCloud.fleetDetails}`,
    },
    {
        element: <FleetManagementPage />,
        path: paths.pekoCloud.fleet,
    },
    {
        element: <FinancialsPage />,
        path: paths.pekoCloud.financials,
    },
    {
        element: <ChequeBookDetailsPage />,
        path: `${paths.pekoCloud.financials}/${paths.pekoCloud.chequeBookDetails}`,
    },
    {
        element: <ChequeDetailsPage />,
        path: `${paths.pekoCloud.financials}/${paths.pekoCloud.chequeDetails}`,
    },
];

import { lazy } from 'react';

import { paths } from '../paths';

const ManageFleet = lazy(() => import('@src/domains/dashboard/turbo/pages/ManageFleet'));
const OperationLog = lazy(() => import('@src/domains/dashboard/turbo/pages/OperationLog'));
const HomePage = lazy(() => import('@src/domains/dashboard/turbo/pages/Dashboard'));
const AddVehicle = lazy(() => import('@src/domains/dashboard/turbo/pages/AddVehicle'));
const ViewDetails = lazy(() => import('@src/domains/dashboard/turbo/pages/ViewDetails'));
const DriverProfile = lazy(() => import('@src/domains/dashboard/turbo/pages/DriverProfiles'));
const AddDriver = lazy(() => import('@src/domains/dashboard/turbo/pages/AddDriver'));
const DocCentre = lazy(() => import('@src/domains/dashboard/turbo/pages/DocumentCenter'));
const DriverDetails = lazy(() => import('@src/domains/dashboard/turbo/pages/DriverDetails'));
const ManageSubscription = lazy(
    () => import('@src/domains/dashboard/turbo/pages/ManageSubscription')
);
const TurboChallans = lazy(() => import('@src/domains/dashboard/challan/pages/TurboChallansPage'));
const ChallanOrderHistory = lazy(
    () => import('@src/domains/dashboard/challan/pages/ChallanOrderHistoryPage')
);
const VehicleReports = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/VehicleReportsPage')
);
const SelectVehicle = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/SelectVehiclePage')
);
const ValuationReport = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/ValuationReportPage')
);
const HistoryReport = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/HistoryReportPage')
);
const InspectionService = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/InspectionServicePage')
);
const InspectionBooking = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/InspectionBookingPage')
);
const ReportOrderHistory = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/ReportOrderHistoryPage')
);
const ReportOrderDetail = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/ReportOrderDetailPage')
);
const ReportPaymentSuccess = lazy(
    () => import('@src/domains/dashboard/vehicleReports/pages/ReportPaymentSuccessPage')
);

// -----------------------------------------------------------------------

export const TurboRoutes = [
    { element: <HomePage />, index: true },
    {
        element: <AddVehicle />,
        path: paths.turbo.addVehicle,
    },
    {
        element: <ViewDetails />,
        path: `${paths.turbo.manageFleet}/${paths.turbo.viewDetails}`,
    },
    {
        element: <DriverProfile />,
        path: paths.turbo.driverProfiles,
    },
    {
        element: <AddDriver />,
        path: paths.turbo.addDriver,
    },
    {
        element: <DriverDetails />,
        path: `${paths.turbo.driverProfiles}/${paths.turbo.driverDetails}`,
    },
    {
        element: <DocCentre />,
        path: paths.turbo.documentCentre,
    },
    {
        element: <ManageSubscription />,
        path: paths.turbo.manageSubscription,
    },
    {
        element: <OperationLog />,
        path: paths.turbo.operationLog,
    },
    {
        element: <ManageFleet />,
        path: paths.turbo.manageFleet,
    },
    {
        element: <TurboChallans />,
        path: paths.turbo.challans,
    },
    {
        element: <ChallanOrderHistory />,
        path: `${paths.turbo.challans}/${paths.turbo.challanOrders}`,
    },
    // Vehicle Reports (Droom valuation / history / inspection).
    {
        element: <SelectVehicle />,
        path: `${paths.turbo.vehicleReports}/:reportType/${paths.turbo.selectVehicle}`,
    },
    {
        element: <ValuationReport />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.valuationReport}`,
    },
    {
        element: <HistoryReport />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.historyReport}`,
    },
    {
        element: <InspectionBooking />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.inspection}/${paths.turbo.inspectionBooking}`,
    },
    {
        element: <InspectionService />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.inspection}`,
    },
    {
        element: <ReportOrderDetail />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.reportOrders}/${paths.turbo.reportOrderDetails}`,
    },
    {
        element: <ReportOrderHistory />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.reportOrders}`,
    },
    {
        element: <ReportPaymentSuccess />,
        path: `${paths.turbo.vehicleReports}/${paths.turbo.reportSuccess}`,
    },
    {
        element: <VehicleReports />,
        path: paths.turbo.vehicleReports,
    },
];

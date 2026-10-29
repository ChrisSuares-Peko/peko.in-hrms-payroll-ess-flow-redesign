import { lazy } from 'react';

import { paths } from '../paths';

// const LogisticsHome = lazy(() => import('@src/domains/dashboard/logisticsV2/pages/LogisticsHome'));
// const ShipmentDetailsPage = lazy(
//     () => import('@src/domains/dashboard/logisticsV2/pages/ShipmentDetails')
// );
// const TrackShipmentPage = lazy(
//     () => import('@src/domains/dashboard/logisticsV2/pages/TrackShipment')
// );
// const OrderHistoryPage = lazy(
//     () => import('@src/domains/dashboard/logisticsV2/pages/OrderHistory')
// );
const LogisticsHome = lazy(() => import('@src/domains/dashboard/logisticsNew/pages/Home'));
const ShipmentDetailsPage = lazy(
    () => import('@src/domains/dashboard/logisticsNew/pages/ShipmentDetails')
);
const TrackShipmentPage = lazy(
    () => import('@src/domains/dashboard/logisticsNew/pages/TrackShipment')
);
const OrderHistoryPage = lazy(
    () => import('@src/domains/dashboard/logisticsNew/pages/OrderHistory')
);
const ReturnShipmentPage = lazy(
    () => import('@src/domains/dashboard/logisticsNew/pages/ReturnShipment')
);
const AddressBookPage = lazy(
    () => import('@src/domains/dashboard/logisticsNew/pages/AddressBook')
);

export const logisticsRoutes = [
    { element: <LogisticsHome />, index: true },
    { element: <ShipmentDetailsPage />, path: paths.logistics.details },
    { element: <OrderHistoryPage />, path: paths.logistics.orderHistory },
    {
        element: <TrackShipmentPage />,
        path: `${paths.logistics.orderHistory}/${paths.logistics.trackOrderDetails}`,
    },
    {
        element: <ReturnShipmentPage />,
        path: `${paths.logistics.orderHistory}/${paths.logistics.returnShipment}`,
    },
    { element: <AddressBookPage />, path: paths.logistics.addressBook },
];

import { lazy } from 'react';

import { paths } from '../paths';

const BusHome = lazy(() => import('@src/domains/dashboard/BusTickets/pages/BusHome'));
const BusSearchResults = lazy(() => import('@src/domains/dashboard/BusTickets/pages/BusSearchResults'));
const BusSeatSelection = lazy(() => import('@src/domains/dashboard/BusTickets/pages/BusSeatSelection'));
const TravellerDetails = lazy(() => import('@src/domains/dashboard/BusTickets/pages/TravellerDetails'));
const ReviewBooking = lazy(() => import('@src/domains/dashboard/BusTickets/pages/ReviewBooking'));
const ManageBookings = lazy(() => import('@src/domains/dashboard/BusTickets/pages/ManageBookings'));
const BookingConfirmed = lazy(() => import('@src/domains/dashboard/BusTickets/pages/BookingConfirmed'));

export const busRoutes = [
    { element: <BusHome />, index: true },
    { element: <BusSearchResults />, path: paths.bus.results },
    { element: <BusSeatSelection />, path: `${paths.bus.results}/${paths.bus.seatSelection}` },
    {
        element: <TravellerDetails />,
        path: `${paths.bus.results}/${paths.bus.seatSelection}/${paths.bus.traveller}`,
    },
    {
        element: <ReviewBooking />,
        path: `${paths.bus.results}/${paths.bus.seatSelection}/${paths.bus.traveller}/${paths.bus.review}`,
    },
    { element: <ManageBookings />, path: paths.bus.manageBookings },
    { element: <BookingConfirmed />, path: paths.bus.bookingConfirmed },
];

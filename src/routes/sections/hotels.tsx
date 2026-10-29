import { lazy } from 'react';

import { paths } from '../paths';

const Hotels = lazy(() => import('@domains/dashboard/Hotels/Pages/Hotels'));
const HotelDetails = lazy(() => import('@domains/dashboard/Hotels/Pages/Details'));
const HotelView = lazy(() => import('@domains/dashboard/Hotels/Pages/HotelView'));
const Bookings = lazy(() => import('@domains/dashboard/Hotels/Pages/BookingDetails'));
const Manage = lazy(() => import('@src/domains/dashboard/Hotels/Pages/ManageBookingPage'));
const Details = lazy(() => import('@domains/dashboard/Hotels/Pages/UserDetails'));

export const hotelsRoutes = [
    { element: <Hotels />, index: true },
    { element: <HotelDetails />, path: paths.hotels.details },
    { element: <HotelView />, path: `${paths.hotels.details}/${paths.hotels.hotelView}` },
    {
        element: <Details />,
        path: `${paths.hotels.details}/${paths.hotels.hotelView}/${paths.hotels.userDetails}`,
    },
    {
        element: <Bookings />,
        path: `${paths.hotels.details}/${paths.hotels.hotelView}/${paths.hotels.userDetails}/${paths.hotels.bookings}`,
    },
    { element: <Manage />, path: paths.hotels.manageBookings },
];

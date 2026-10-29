import { lazy } from 'react';

import { paths } from '../paths';

const AirlineHome = lazy(() => import('@src/domains/dashboard/Airline/pages/Home'));
const SearchResults = lazy(() => import('@src/domains/dashboard/Airline/pages/SearchResults'));
const AirlineDetail = lazy(() => import('@src/domains/dashboard/Airline/pages/AirlineDetail'));
const ManageBooking = lazy(() => import('@src/domains/dashboard/Airline/pages/ManageBooking'));
const Summary = lazy(() => import('@src/domains/dashboard/Airline/pages/Summary'));
const BookingDetails = lazy(() => import('@src/domains/dashboard/Airline/pages/BookingDetails'));
const CancelDetails = lazy(() => import('@src/domains/dashboard/Airline/pages/CancelDetails'));
const CancelSuccess = lazy(
    () => import('@src/domains/dashboard/Airline/pages/CancellationSuccessPage')
);

export const airlineRoutes = [
    { element: <AirlineHome />, index: true },
    { element: <SearchResults />, path: paths.airline.results },
    { element: <AirlineDetail />, path: `${paths.airline.results}/${paths.airline.details}` },
    {
        element: <Summary />,
        path: `${paths.airline.results}/${paths.airline.details}/${paths.airline.summary}`,
    },
    { element: <ManageBooking />, path: paths.airline.manage },
    {
        element: <BookingDetails />,
        path: `${paths.airline.manage}/${paths.airline.bookingDetails}`,
    },
    {
        element: <CancelDetails />,
        path: `${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.cancelDetails}`,
    },
    {
        element: <CancelSuccess />,
        path: `${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.cancelSuccess}`,
    },
];

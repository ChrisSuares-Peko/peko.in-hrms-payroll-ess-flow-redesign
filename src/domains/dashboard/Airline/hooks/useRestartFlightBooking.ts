import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { resetPaymentData } from '../../payments/slices/payment';
import {
    setTraceId,
    setBookingCompletedAt,
    resetSelectedAirlines,
    resetBookingData,
    resetpriceRange,
    setfilghtResponse,
    setInbountFlightResponse,
    setPaymentDetails,
    setProvBookingSuccess,
} from '../slices/airlineSlice';

// A TraceId is bound to one search, so any failed attempt must restart from search, never re-pay.
export default function useRestartFlightBooking() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    return useCallback(() => {
        dispatch(setTraceId(''));
        dispatch(setBookingCompletedAt(null));
        dispatch(resetSelectedAirlines({}));
        dispatch(setProvBookingSuccess(null));
        dispatch(setPaymentDetails(null));
        dispatch(resetBookingData({}));
        dispatch(resetpriceRange());
        dispatch(setfilghtResponse([]));
        dispatch(setInbountFlightResponse([]));
        dispatch(resetPaymentData());
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.results}`,
            { state: { flightkey: 'searchFlights' } }
        );
    }, [dispatch, navigate]);
}

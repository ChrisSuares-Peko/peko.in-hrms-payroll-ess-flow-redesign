import { useState } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { getBookingDetailsApi } from '../api';
import { setSelectedOrderDetails } from '../slices/airlineSlice';
import { BookingDetailsRes } from '../types/manageBookings';

export default function useBookingDetails() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const orderDetails = useAppSelector(state => state.reducer.airline.orderDetails);

    const [isLoading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState<any>();

    const getBookingDetails = async (bookingId: number | undefined, refresh: boolean) => {
        if (!bookingId && !orderDetails?.orderId) return false;
        setLoading(true);
        const data: BookingDetailsRes | false = await getBookingDetailsApi({
            userId: id,
            userType: role,
            id: bookingId || orderDetails?.orderId,
        });
        if (data) {
            dispatch(setSelectedOrderDetails(data));
            setBookingData(data);
            setLoading(false);
            return true;
        }
        setLoading(false);
        return false;
    };

    return { getBookingDetails, data: bookingData, isLoading };
}

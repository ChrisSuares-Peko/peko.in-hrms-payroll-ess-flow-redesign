import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { allBookings } from '../Api';
import { Booking, bookingData } from '../types/managebookingTypes';

export default function useManageBokingsApi(currentPage: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [bookings, setBookingData] = useState<Booking[]>([]);
    const [details, setDetails] = useState<bookingData>();

    const manageBookings = useCallback(async () => {
        const data: bookingData | false = await allBookings({
            userId: id,
            userType: role,
            currentPage,
        });

        if (data) {
            setDetails(data);
            const bookingArr = data.bookings as Booking[];
            
            setBookingData(bookingArr);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, currentPage]);

    const refetch = () => {
        manageBookings();
    };

    useEffect(() => {
        manageBookings();
    }, [manageBookings]);
    return { isLoading, data: bookings, bookings: details, refetch };
}

import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ancillariesProvBookingAPI } from '../api/index';
import { AncProvBookSuccessResponse } from '../types/ancProvBookSuccess';

export default function useAncillaryProvBooking() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const bookingData = useAppSelector(state => state.reducer.airline.selectedAncillaries);

    const ancillaryProvBooking = async () => {
        const data: AncProvBookSuccessResponse | false = await ancillariesProvBookingAPI({
            userId: id,
            userType: role,
            postData: bookingData,
        });

        if (data !== false) {
            const res = data;
            setIsLoading(false);
            return res;
        }

        setIsLoading(false);
        return false;
    };

    return { handleAncProvBooking: ancillaryProvBooking, isLoading };
}

import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { prebookHotel } from '../Api';
import { HotelBookingResponse } from '../types/bookingTypes';

export default function usePrebookApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [prebookRes, setPrebookRes] = useState<HotelBookingResponse | false>(false);

    const PrebookDetails = useCallback(
        async (BookingCode: string, amount: number) => {
            const data: any | false = await prebookHotel({
                userId: id,
                userType: role,
                BookingCode,
                amount,
            });

            return data as any;
        },
        [id, role]
    );

    return { isLoading, PrebookDetails };
}

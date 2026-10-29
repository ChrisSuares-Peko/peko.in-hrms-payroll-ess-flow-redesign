import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDownloadTicket } from '../../api/airline/airlineBooking';

export default function useDownloadTicket() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const HandleDownloadTicket = async (orderId: string | number) => {
        setIsLoading(true);
        const data: any | false = await getDownloadTicket({
            userId: id,
            userType: role,
            orderId,
        });

        setIsLoading(false);
        return data;
    };

    return { HandleDownloadTicket, isLoading };
}

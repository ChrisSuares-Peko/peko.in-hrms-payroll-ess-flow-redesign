import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateBooking } from '../api/index';

export default function useUpdateBooking() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);

    const HandleUpdateBooking = async (orderId: string | number) => {
        const data: any | false = await updateBooking({
            userId: id,
            userType: role,
            orderId,
        });

        setIsLoading(false);
        return data;
    };

    return { HandleUpdateBooking, isLoading };
}

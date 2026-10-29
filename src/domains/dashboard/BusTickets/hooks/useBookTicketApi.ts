import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { bookTicket } from '../api';

export default function useBookTicketApi() {
    const { role, id }  = useAppSelector(state => state.reducer.auth);
    const blockKey      = useAppSelector(state => state.reducer.busTicket.blockKey);
    const contactPhone  = useAppSelector(state => state.reducer.busTicket.contactPhone);
    const contactEmail  = useAppSelector(state => state.reducer.busTicket.contactEmail);
    const [isLoading, setIsLoading] = useState(false);

    const book = async ({
        couponCode = '',
        couponAmount = 0,
        pgAmount,
    }: {
        couponCode?: string;
        couponAmount?: number | string;
        pgAmount?: number | string;
    } = {}) => {
        if (!blockKey) return null;
        setIsLoading(true);
        const result = await bookTicket({
            userId: id,
            userType: role,
            blockKey,
            contactPhone,
            contactEmail,
            couponCode,
            couponAmount,
            pgAmount,
        });
        setIsLoading(false);
        return result;
    };

    return { book, isLoading };
}

import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateTicket } from '../api/index';
import { ticketUpdatePayload, ticketUpdateResponse } from '../types/type';

export const useTicketUpdate = (chatId: number | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [responseData, setResponseData] = useState<ticketUpdateResponse | false>();

    const handleTicketUpdate = async (payload: ticketUpdatePayload) => {
        setLoading(true);
        const response: false | ticketUpdateResponse = await updateTicket({
            ...payload,
            userId: id,
            userType: role,
            chatId,
        });
        if (response) {
            setResponseData(response);
            setLoading(false);
            return true;
        }
        setLoading(false);
        return false;
    };
    return { handleTicketUpdate, responseData, isLoading: loading };
};

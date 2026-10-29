import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateTicketStatus } from '../api/index';
import { ticketUpdateResponse } from '../types/type';

export const useTicketUpdate = (chatId: number | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [responseData, setResponseData] = useState<ticketUpdateResponse | false>();

    const handleTicketStatusUpdate = async (payload: any) => {
        setLoading(true);
        const response: false | ticketUpdateResponse = await updateTicketStatus({
            status: payload,
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
    return { handleTicketStatusUpdate, responseData, isLoading: loading };
};

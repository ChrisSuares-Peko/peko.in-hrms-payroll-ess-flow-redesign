import { useEffect, useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSingleTicket } from '../api/index';
import { singleTicketData, singleTicketResponse } from '../types/type';

const useSocketChat = (roomId: number | null, reload: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [ticketDetails, setTicketDetails] = useState<singleTicketData>();
    const [isLoading, setIsLoading] = useState(true);

    const fetchInitialMessages = useCallback(async () => {
        setIsLoading(true);
        const data: singleTicketResponse | false = await getSingleTicket({
            userId: id,
            userType: role,
            ticketId: roomId,
        });
        if (data) {
            setTicketDetails(data as singleTicketResponse);
        }
        setIsLoading(false);
    }, [id, role, roomId]);

    useEffect(() => {
        if (roomId) {
            fetchInitialMessages();
        }
    }, [fetchInitialMessages, roomId, reload]);

    return { data: ticketDetails, isLoading };
};

export default useSocketChat;

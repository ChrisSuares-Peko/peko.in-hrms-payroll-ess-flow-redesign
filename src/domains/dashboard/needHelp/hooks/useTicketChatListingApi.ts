import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTicketChatData } from '../api/index';

export const useTicketChatListingApi = (id: number) => {
    const { role: userType, id: userId } = useAppSelector(state => state.reducer.auth);

    const [tableDetails, setTableDetails] = useState<any[]>([]);
    const [count, setCount] = useState<number>();
    const [requesterId, setRequesterId] = useState<number>(0);

    const [isLoading, setIsLoading] = useState(true);

    const getTicketChatList = useCallback(async () => {
        setIsLoading(true); // Start loading
        const data = await getTicketChatData({ userType, userId, id });
        if (data && data.status) {
            setTableDetails(data.data.conversations);
            setCount(data.data.conversations.length);
            setRequesterId(data.data.requesterId);
        } else {
            setTableDetails([]);
            setCount(0);
        }
        setIsLoading(false); // End loading
    }, [id, userId, userType]);

    useEffect(() => {
        getTicketChatList();
    }, [getTicketChatList]);

    return { data: tableDetails, isLoading, count, requesterId, getTicketChatList };
};

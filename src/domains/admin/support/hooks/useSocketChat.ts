import { useEffect, useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSingleTicket, createChat } from '../api/index';
import { Chat, singleTicketData, singleTicketResponse } from '../types/type';

const useSocketChat = (roomId: number | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [ticketDetails, setTicketDetails] = useState<singleTicketData>();
    const [messages, setMessages] = useState<Chat[]>([]);
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

        if (data && 'chats' in data) {
            setMessages(data.chats);
        }
        setIsLoading(false);
    }, [id, role, roomId]);

    const sendMessage = useCallback(
        async (messageData: Chat) => {
            if (!roomId) return;
            await createChat({
                userId: id,
                userType: role,
                supportId: roomId,
                isAdmin: messageData.isAdmin ?? true,
                message: messageData.message,
                name: messageData.name,
                date: messageData.date,
            });
            setMessages(prevMessages => [...prevMessages, messageData]);
        },
        [id, role, roomId]
    );

    useEffect(() => {
        if (roomId) {
            fetchInitialMessages();
        }
    }, [fetchInitialMessages, roomId]);

    return { data: ticketDetails, isLoading, messages, sendMessage };
};

export default useSocketChat;

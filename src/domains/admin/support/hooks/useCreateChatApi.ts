import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createChat } from '../api/index';
import { createChatPayload, createChatResponse } from '../types/type';

export default function useTicketCreate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<createChatResponse | false>();
    const [isLoading, setIsLoading] = useState(false);

    const handleTicketCreation = async (payload: createChatPayload) => {
        setIsLoading(true);
        const response: false | createChatResponse = await createChat({
            ...payload,
            userId: id,
            userType: role,
        });
        setIsLoading(false);

        setResponseData(response);
    };
    return { handleTicketCreation, responseData, isLoading };
}

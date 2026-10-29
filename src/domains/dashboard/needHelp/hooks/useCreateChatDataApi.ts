import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { createChatDataPayload } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createChatData } from '../api/index';
import { ConversationResponse, ConversationData } from '../types/type';

export default function useTicketCreate() {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<ConversationData>();
    const [isLoading, setIsLoading] = useState(false);

    const handleTicketChatCreation = async (payload: createChatDataPayload) => {
        setIsLoading(true);
        const response: ConversationResponse | false = await createChatData({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response !== false) {
            setResponseData(response.data);
            if (response.status) {
                dispatch(
                    showToast({
                        description: 'Ticket created successfully',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        }
    };
    return { handleTicketChatCreation, responseData, isLoading };
}

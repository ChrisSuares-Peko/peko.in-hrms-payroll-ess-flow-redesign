import { useState } from 'react';

import { updateChatId } from '../api/index';
import { updateChatIdPayload, updateChatIdResponse } from '../types/type';

export default function useUpdateChatId() {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateChatId = async (payload: updateChatIdPayload) => {
        try {
            setIsLoading(true);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response: updateChatIdResponse | false = await updateChatId({
                ...payload,
            });
        } catch (error) {
            console.error('Failed to update chat id:', error);
        } finally {
            setIsLoading(false);
        }
    };
    return { handleUpdateChatId, isLoading };
}

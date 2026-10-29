import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setPendingRequests } from '@src/slices/connectSlice';

import { putRequest } from '../api/index';

type PutRequest = {
    requestId: string;
    status: 'ACCEPTED' | 'REJECTED';
};

export default function usePutRequest() {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handlePutRequest = async ({ requestId, status }: PutRequest) => {
        setIsLoading(true);
        try {
            const response: any = await putRequest({ requestId, status });
            if (response) {
                dispatch(setPendingRequests(response?.pendingRequests ?? 0));
                dispatch(
                    showToast({
                        variant: 'success',
                        description: `Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
                    })
                );
            }
            return response;
        } catch (error) {
            console.error('API error:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };
    return { handlePutRequest, isLoading };
}

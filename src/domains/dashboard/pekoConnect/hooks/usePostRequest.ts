import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { postRequest } from '../api/index';

type PostRequest = {
    receiverId: string;
    message: string;
};

export default function usePostRequest() {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const handlePostRequest = async ({ receiverId, message }: PostRequest) => {
        setIsLoading(true);
        try {
            const response: any = await postRequest({ receiverId, message });
            if (response) {
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Connection request has been sent.',
                    })
                );
            }
        } catch (error) {
            console.error('Error posting request:', error);
        } finally {
            setIsLoading(false);
        }
    };
    return { handlePostRequest, isLoading };
}

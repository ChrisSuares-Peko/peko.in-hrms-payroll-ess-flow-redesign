import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getNotificationApi } from '../api/notification';

const useNotification = () => {
    const [isLoading, setIsLoading] = useState(false);
 
    const dispatch = useAppDispatch();

   

    const sendNotification = async () => {
        setIsLoading(true);
        const response: any = await getNotificationApi();
        if (response) {
            dispatch(
                showToast({
                    description: 'Notification sent successfully',
                    variant: 'success',
                })
            );
            // setNotificationExists(true);
        } else {
            dispatch(
                showToast({
                    description: 'Failed to send notification',
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
    };
    return {
        isLoading,
        sendNotification,
        // notificationExists
    };
};

export default useNotification;

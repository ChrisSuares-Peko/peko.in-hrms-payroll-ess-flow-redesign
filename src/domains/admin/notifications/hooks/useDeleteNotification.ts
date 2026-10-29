import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteNotification } from '../api/index';
import { NotificationId } from '../types/index';

const useDeleteNotification = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const deleteNotificationData = useCallback(
        async (payload: NotificationId) => {
            setIsLoading(true);
            const response: {} | false = await deleteNotification({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);

            return response;
        },
        [id, role]
    );

    return {
        isLoading,
        deleteNotificationData,
    };
};

export default useDeleteNotification;

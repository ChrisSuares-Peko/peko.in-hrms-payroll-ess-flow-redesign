import { useCallback, useEffect } from 'react';

import Pusher from 'pusher-js';

import { notificationListResponse } from '@customtypes/general';
import { VITE_PUSHER_APPKEY } from '@src/config-global';
import { getNotifications, resetNotifications } from '@src/services/notification';
import { resetNotificationCounter, setNotifications } from '@src/slices/userSlice';

import { useAppDispatch, useAppSelector } from './store';

export default function useNotificationApi() {
    const dispatch = useAppDispatch();
    const { role, id, username, subCorporateUsername } = useAppSelector(state => state.reducer.auth);
    const { notifications } = useAppSelector(state => state.reducer.user);
    const getNotificationData = useCallback(async () => {
        if (role === 'corporate') {
            const data: notificationListResponse | false = await getNotifications({
                userId: id,
                userType: role,
            });
            if (data) {
                dispatch(setNotifications({ notifications: { ...data } }));
            }
        }
    }, [id, role, dispatch]);

    useEffect(() => {
        if (notifications === null) {
            getNotificationData();
        }
    }, [getNotificationData, notifications]);

    useEffect(() => {
        const pusher = new Pusher(VITE_PUSHER_APPKEY, { cluster: 'ap2' });
        const subscribedChannel = pusher.subscribe('push-notification');
        subscribedChannel.bind('real-time-notification', (data: any) => {
            if (
                role === 'corporate' &&
                (data.body === username ||
                    (subCorporateUsername && data.body === subCorporateUsername) ||
                    data.body === 'ALL')
            ) {
                getNotificationData();
                // playSound(PinAudio);
            }
        });

        return () => {
            subscribedChannel.unbind_all();
            subscribedChannel.unsubscribe();
        };
    }, [getNotificationData, username, subCorporateUsername, role]);

    // const playSound = (src: string) => {
    //     const sound = new Audio(src);
    //     sound.play().catch(error => console.error('Error playing sound:', error));
    // };

    const resetNotificationCount = async () => {
        if (role === 'corporate') {
            const data: notificationListResponse | false = await resetNotifications({
                userId: id,
                userType: role,
            });
            if (data) {
                dispatch(resetNotificationCounter());
            }
        }
    };
    return { resetNotificationCount };
}

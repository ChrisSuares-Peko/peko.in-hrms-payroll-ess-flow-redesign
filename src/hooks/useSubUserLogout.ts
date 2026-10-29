import { useEffect } from 'react';

import Pusher from 'pusher-js';

import { VITE_PUSHER_APPKEY } from '@src/config-global';
import { handleLogout } from '@src/services/handleLogout';

import { useAppSelector } from './store';

export default function useSubUserLogout() {
    const { roleName, subCorporateId } = useAppSelector(state => state.reducer.auth);
    useEffect(() => {
        const pusher = new Pusher(VITE_PUSHER_APPKEY, { cluster: 'ap2' });
        const subscribedChannel = pusher.subscribe('sub-user-logout');
        subscribedChannel.bind('logged out', (data: any) => {
            if (roleName === 'corporate sub user' && data.credentialId === subCorporateId) {
                handleLogout();
            }
        });
        return () => {
            subscribedChannel.unbind_all();
            subscribedChannel.unsubscribe();
        };
    }, [subCorporateId, roleName]);
}

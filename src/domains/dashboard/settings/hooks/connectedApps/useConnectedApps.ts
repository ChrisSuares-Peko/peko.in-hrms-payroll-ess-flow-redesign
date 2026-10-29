import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getConnectedApps, revokeConnectedApp } from '../../api/connectedApps';
import { ConnectedApp } from '../../types/connectedApps';

export default function useConnectedApps() {
    const dispatch = useAppDispatch();
    const [apps, setApps] = useState<ConnectedApp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState(false);

    const fetchApps = useCallback(async () => {
        setIsLoading(true);
        const data = await getConnectedApps();
        if (data) {
            setApps(data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const revokeApp = async (id: number) => {
        setIsRevoking(true);
        const res = await revokeConnectedApp(id);
        if (res) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: res.message || 'Access revoked successfully',
                })
            );
            await fetchApps();
        }
        setIsRevoking(false);
    };

    return { apps, isLoading, isRevoking, revokeApp, reload: fetchApps };
}

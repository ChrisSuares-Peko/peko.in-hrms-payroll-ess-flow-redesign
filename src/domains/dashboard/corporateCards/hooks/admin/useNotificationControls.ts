import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getNotificationControls,
    NotificationControlKey,
    NotificationControls,
    updateNotificationControls,
} from '../../api/admin/settingsApi';

const DEFAULTS: NotificationControls = {
    requireReceipts: true,
    autoDeclineOverLimit: true,
    notifyPendingKyc: true,
    weeklySpendDigest: true,
};

export const useNotificationControls = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [controls, setControls] = useState<NotificationControls>(DEFAULTS);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState<NotificationControlKey | null>(null);

    const fetchControls = useCallback(async () => {
        setIsLoading(true);
        const res = await getNotificationControls(role, id);
        if (res && res.data?.notificationControls) setControls(res.data.notificationControls);
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        fetchControls();
    }, [fetchControls]);

    const toggle = async (key: NotificationControlKey, next: boolean) => {
        const previous = controls[key];
        setControls(current => ({ ...current, [key]: next }));
        setSaving(key);
        const res = await updateNotificationControls(role, id, { [key]: next });
        setSaving(null);
        if (!res) {
            setControls(current => ({ ...current, [key]: previous }));
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not save that setting. Please try again.',
                })
            );
            return;
        }
        if (res.data?.notificationControls) setControls(res.data.notificationControls);
    };

    return { controls, isLoading, saving, toggle };
};

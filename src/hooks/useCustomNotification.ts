import { useCallback, useEffect } from 'react';

import { notification } from 'antd';

import { useAppSelector } from './store';

export default function useCustomNotification() {
    const [api, contextHolder] = notification.useNotification({ maxCount: 1 });
    const { variant, description, showToast } = useAppSelector(state => state.reducer.api);

    const openNotification = useCallback(() => {
        if (description) {
            api[variant]({
                message: '',
                description,
                closeIcon: false,
                duration: 3,
            });
        }
    }, [api, description, variant]);

    useEffect(() => {
        openNotification();
    }, [openNotification, showToast]);

    return {
        contextHolder,
    };
}

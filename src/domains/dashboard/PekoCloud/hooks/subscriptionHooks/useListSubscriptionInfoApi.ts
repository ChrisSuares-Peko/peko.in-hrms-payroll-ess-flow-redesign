import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { subscriptionInfo } from '../../api/subscriptions';
import { SubscriptionInfoResponse } from '../../types/subscriptions';

export const useGetAllSubscriptionInfoApi = (reloadTable: boolean) => {
    const initialInfoDetails = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalUsers: 0,
        totalSpent: 0,
    };

    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [isLoading, setIsLoading] = useState(true);

    const getubscriptionInfo = useCallback(async () => {
        setIsLoading(true);
        const data: SubscriptionInfoResponse | false = await subscriptionInfo({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                totalSubscriptions: data.totalSubscriptions,
                activeSubscriptions: data.activeSubscriptions,
                totalUsers: data.totalUsers,
                totalSpent: Number(data.totalSpent),
            });
        }

        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getubscriptionInfo();
    }, [getubscriptionInfo, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};

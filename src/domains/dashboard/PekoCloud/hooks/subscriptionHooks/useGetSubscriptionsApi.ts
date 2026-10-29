import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listSubscription } from '../../api/subscriptions';
import { SubscriptionListingResponse } from '../../types/subscriptions';

export function useGetSubscriptions() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const allAssetList = useCallback(async () => {
        const data: SubscriptionListingResponse | false = await listSubscription({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                subscriptionName: item.subscriptionName ?? '',
                id: item.id ?? '',
                assignTo: item.assignTo ?? [],
                status: item.status ?? '',
            }));

            setSubscriptions(arr);
        }
    }, [role, id]);

    useEffect(() => {
        allAssetList();
    }, [allAssetList]);

    const generateSubscriptionsDropdown = (data: any[]) => {
        const excludedStatuses = ['Inactive', 'Pending', 'Cancelled', 'Suspended', 'Failed'];

        return data
            .filter(subscription => !excludedStatuses.includes(subscription.status))
            .map(subscription => ({
                value: subscription.id,
                label: subscription.subscriptionName,
            }));
    };
    return { subscriptionsData: subscriptions, generateSubscriptionsDropdown };
}

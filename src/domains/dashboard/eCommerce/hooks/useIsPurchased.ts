import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getIsServiceAccess } from '../api';
import { isPurchasedResponse } from '../types';

interface SubscriptionState {
    isPurchased: boolean;
    status: string;
    subscriptionEndDate: string;
    packageName: string;
    subscriptionAmountPaid: number;
    upgradeCredit: number;
    subscriptionStartDate: string;
    billingType: string;
    id: number;
    isCancelled: boolean;
    previousSubscription: null | {
        packageId: string;
        packageName: string;
        subscriptionEndDate: string;
        billingType: string;
        status: string;
    };
}

const defaultState: SubscriptionState = {
    isPurchased: false,
    status: '',
    subscriptionEndDate: '',
    packageName: '',
    subscriptionAmountPaid: 0,
    upgradeCredit: 0,
    subscriptionStartDate: '',
    billingType: '',
    id: 0,
    isCancelled: false,
    previousSubscription: null,
};

export default function useIsPurchased() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SubscriptionState>(defaultState);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAccess = useCallback(async () => {
        setIsLoading(true);
        const resp: isPurchasedResponse | false = await getIsServiceAccess({
            userId: id,
            userType: role,
        });
        if (resp) {
            setData({
                isPurchased: resp.isPurchased,
                status: resp.status,
                subscriptionEndDate: resp.subscriptionEndDate,
                packageName: resp.package?.packageName ?? '',
                subscriptionAmountPaid: resp.subscriptionAmountPaid,
                upgradeCredit: resp.upgradeCredit,
                subscriptionStartDate: resp.subscriptionStartDate,
                billingType: resp.billingType,
                id: resp.id,
                isCancelled: resp.isCancelled,
                previousSubscription: resp.previousSubscription,
            });
        }
        setIsLoading(false);
    }, [id, role]);

    const refetch = () => {
        fetchAccess();
    };

    useEffect(() => {
        fetchAccess();
    }, [fetchAccess]);

    return { data, isLoading, refetch };
}

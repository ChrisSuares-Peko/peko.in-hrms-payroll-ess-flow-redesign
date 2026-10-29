import { useState, useEffect, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listSubscription } from '../../api/subscriptions';
import { SubscriptionListingResponse } from '../../types/subscriptions';

export const useGetAllSubscriptionApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [subscriptionListData, setSubscriptionListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getSubscriptionList = useCallback(async () => {
        setIsLoading(true);
        const data: SubscriptionListingResponse | false = await listSubscription({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
        });
        if (data) {
            const arr = data.result.map(item => ({
                subscriptionName: item?.subscriptionName ?? '',
                planDetails: item?.planDetails ?? '',
                billingStartDate: item?.billingStartDate ?? '',
                billingCycle: item?.billingCycle ?? '',
                assignTo: item?.assignTo ?? '',
                assignedTo: item?.assignTo ? item.assignTo.length : 0,
                numberOfDevices: item?.numberOfDevices ?? '',
                amount: item?.amount ?? '',
                status: item?.status ?? '',
                currency: item?.currency ?? '',
                id: item?.id ?? '',
                actions: '',
            }));

            setCount(data.totalData);
            setSubscriptionListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);

    useEffect(() => {
        getSubscriptionList();
    }, [getSubscriptionList, reloadTable]);

    return {
        tableDatas: subscriptionListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};

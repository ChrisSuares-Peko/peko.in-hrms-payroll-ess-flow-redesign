import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSubscriptions } from '../api/index';
import { SubscriptionListResponse, SubscriptionTableData } from '../types/types';

export default function useSubscriptionApi(
    searchText: string,
    page: number,
    category: string,
    length: number,
    selectedCategory: number | null
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<SubscriptionTableData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getSubscriptionList = useCallback(async () => {
        setIsLoading(true);
        const data: SubscriptionListResponse | false = await getSubscriptions({
            userId: id,
            userType: role,
            searchText,
            page,
            category,
            length,
            selectedCategory,
        });
        if (data) {
            const subscriptionData = data as SubscriptionListResponse;
            const arr = subscriptionData?.data?.map(subscription => ({
                id: subscription.id ?? '',
                name: subscription.name ?? '',
                description: subscription.description ?? '',
                image: subscription.image ?? '',
                badge: subscription.discount !== '0.00' ? subscription.discount : '',
            }));
            setTableData(arr);
            setCount(subscriptionData.recordsTotal);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, searchText, page, category, length, selectedCategory]);

    useEffect(() => {
        getSubscriptionList();
    }, [getSubscriptionList]);

    return { data: tableData, isLoading, count };
}

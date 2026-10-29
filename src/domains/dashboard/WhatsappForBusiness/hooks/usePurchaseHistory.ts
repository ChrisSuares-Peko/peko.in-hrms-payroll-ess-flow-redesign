import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPurchaseHistory } from '../api/orderHistory';
import {
    ActiveSubscription,
    PackageQueryParams,
    ResponseDataSubscriptionHistory,
} from '../types/orderHistory';

export default function usePurchaseHistory({
    itemsPerPage,
    page,
    packageType,
    searchText,
    status,
}: PackageQueryParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<ActiveSubscription[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscription>();
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getPurchaseHistories = useCallback(async () => {
        setIsLoading(true);
        const data: ResponseDataSubscriptionHistory | false = await getPurchaseHistory({
            itemsPerPage,
            page,
            packageType,
            searchText,
            status,
            userId: id,
            userType: role,
        });
        if (data) {
            if (
                packageType &&
                data.activeSubscriptions.rows &&
                data.activeSubscriptions.rows.length > 0
            ) {
                setCurrentSubscription(data.activeSubscriptions.rows[0]);
            }
            setTableData(data.activeSubscriptions.rows);
            setCount(data.activeSubscriptions.count);
        }
        setIsLoading(false);
    }, [itemsPerPage, page, packageType, searchText, status, id, role]);

    useEffect(() => {
        getPurchaseHistories();
    }, [getPurchaseHistories]);

    return {
        data: tableData,
        isLoading,
        count,
        currentSubscription,
        refetch: getPurchaseHistories,
    };
}

import { useCallback, useEffect, useState } from 'react';

import { getPurchaseHistory } from '../../api/subscription';
import {
    ActiveSubscription,
    PackageQueryParams,
    ResponseDataSubscriptionHistory,
} from '../../types/subscription';

export default function usePurchaseHistory({
    itemsPerPage,
    page,
    packageType,
    status,
}: PackageQueryParams) {
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
            status,
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
    }, [itemsPerPage, page, packageType, status]);

    useEffect(() => {
        getPurchaseHistories();
    }, [getPurchaseHistories]);

    return { data: tableData, isLoading, count, currentSubscription };
}

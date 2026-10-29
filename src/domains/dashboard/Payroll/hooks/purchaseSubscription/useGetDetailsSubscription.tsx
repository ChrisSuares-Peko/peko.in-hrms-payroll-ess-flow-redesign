import { useCallback, useEffect, useState } from 'react';

import { getPurchaseDetailsApi } from '../../api/purchaseSubscription';
import { PackageDetails, SubscriptionDetailsResponse } from '../../types/purchaseSubscription';

export function useGetDetailsSubscription(accessKey: string) {
    const [details, setDetails] = useState<PackageDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const employeeList = useCallback(async () => {
        const data: SubscriptionDetailsResponse | false = await getPurchaseDetailsApi({
            accessKey,
        });
        if (data) {
            setDetails(data.packageDetails);
        }
        setIsLoading(false);
    }, [accessKey]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    return { data: details, isLoading };
}

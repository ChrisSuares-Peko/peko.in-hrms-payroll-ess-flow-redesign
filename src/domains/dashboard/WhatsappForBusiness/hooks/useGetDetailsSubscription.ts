import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPurchaseDetailsApi } from '../api/index';
import { PackageDetails, SubscriptionDetailsResponse } from '../types/types';

type Props = {
    accessKey?: string;
    packageName?: string;
};

export function useGetDetailsSubscription({ accessKey }: Props) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [details, setDetails] = useState<PackageDetails>();
    const [packages, setPackages] = useState<PackageDetails[]>();
    const [deduction, setDeduction] = useState<number | null>();

    const [isLoading, setIsLoading] = useState(true);
    const employeeList = useCallback(async () => {
        setIsLoading(true);
        const data: SubscriptionDetailsResponse | false = await getPurchaseDetailsApi({
            accessKey,
            userId: id,
            userType: role,
        });
        if (data) {
            const { packageDetails, discountPrice } = data;
            if (Array.isArray(packageDetails) && packageDetails.length) {
                setDetails(packageDetails[0]);
                setPackages(packageDetails);
                setDeduction(discountPrice);
            }
        }
        setIsLoading(false);
    }, [accessKey, id, role]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    return { data: details, isLoading, packages, deduction };
}

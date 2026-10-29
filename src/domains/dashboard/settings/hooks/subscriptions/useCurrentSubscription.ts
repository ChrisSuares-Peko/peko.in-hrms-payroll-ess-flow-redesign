import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { cancelSubscriptionPatch, getPurchaseHistory } from '../../api/subscription';
import {
    ActiveSubscription,
    PackageQueryParams,
    ResponseDataSubscriptionHistory,
} from '../../types/subscription';

export default function useCurrentSubscription({
    itemsPerPage,
    page,
    packageType,
    status,
}: PackageQueryParams) {
    const [groupPackage, setGroupPackage] = useState<ActiveSubscription | null>();
    const [individualPackages, setIndividualPackages] = useState<ActiveSubscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useAppDispatch();

    const getPurchaseHistories = useCallback(async () => {
        setIsLoading(true);
        const data: ResponseDataSubscriptionHistory | false = await getPurchaseHistory({
            itemsPerPage,
            page,
            packageType,
            status,
        });
        if (data && data.activeSubscriptions.rows) {
            if (data.activeSubscriptions.rows.length > 0) {
                // const group =
                //     data.activeSubscriptions.rows.find(
                //         subscription => subscription.package.packageType === 'GROUP'
                //     ) || null;
                const individuals = data.activeSubscriptions.rows.filter(
                    subscription => subscription.package.packageType === 'INDIVIDUAL'
                );
                setGroupPackage(data.currentGroupSubscription);
                setIndividualPackages(individuals);
            } else {
                setGroupPackage(null);
                setIndividualPackages([]);
            }
        }
        setIsLoading(false);
    }, [itemsPerPage, page, packageType, status]);

    const handleCancelSubscription = useCallback(async (subscriptionId: number) => {
        setIsLoading(true);
        const data: { message: string } | false = await cancelSubscriptionPatch(subscriptionId);
        setIsLoading(false);
        if (data) {
            dispatch(showToast({ variant: 'success', description: data.message }));
            await getPurchaseHistories();
            return true;
        }
        return false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        getPurchaseHistories();
    }, [getPurchaseHistories]);

    return {
        data: groupPackage,
        individualPackages,
        isLoading,
        handleCancelSubscription,
        getPurchaseHistories,
    };
}

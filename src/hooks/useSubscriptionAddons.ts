import { useCallback, useEffect, useState } from 'react';

import { SubscriptionAddOnResponse, subscriptionHistoryResponse } from '@customtypes/general';
import { getAddonDetails, getSubscriptionHistory } from '@src/services/subscription';

const useGetAddonDetails = (
    accessKey: string,
    accessCode: string,
    shouldFetchHistory: boolean = true
) => {
    const [isAddonLoading, setIsAddonLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(shouldFetchHistory);
    const [addonData, setAddonsData] = useState<SubscriptionAddOnResponse>();
    const [purchaseData, setPurchaseData] = useState<subscriptionHistoryResponse>();

    const getDetails = useCallback(async () => {
        setIsAddonLoading(true);
        const data: SubscriptionAddOnResponse | false = await getAddonDetails(accessKey);

        if (data) {
            setAddonsData(data);
        }
        setIsAddonLoading(false);
    }, [accessKey]);

    const getPurchaseHistory = useCallback(async () => {
        setIsHistoryLoading(true);
        const data: subscriptionHistoryResponse | false = await getSubscriptionHistory(accessCode);

        if (data) {
            setPurchaseData(data);
        }
        setIsHistoryLoading(false);
    }, [accessCode]);

    useEffect(() => {
        getDetails();
        if (shouldFetchHistory) {
            getPurchaseHistory();
        }
    }, [getDetails, getPurchaseHistory, shouldFetchHistory]);

    const refresh = useCallback(async () => {
        await Promise.all([
            getDetails(),
            shouldFetchHistory ? getPurchaseHistory() : Promise.resolve(),
        ]);
    }, [getDetails, getPurchaseHistory, shouldFetchHistory]);

    return {
        addonData,
        isLoading: isAddonLoading || isHistoryLoading,
        purchaseData,
        refresh,
    };
};

export default useGetAddonDetails;

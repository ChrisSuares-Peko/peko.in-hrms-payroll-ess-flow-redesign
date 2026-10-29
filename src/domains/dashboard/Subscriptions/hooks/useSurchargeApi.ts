import { useCallback, useEffect, useState } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export default function GetSurcharge() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeDetails, setSurchargeDetails] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const { amount } = useAppSelector(state => state.reducer.subscription);

    const getSurchargeData = useCallback(async () => {
        try {
            const data: SurchargeResponse | false = await getSurcharge({
                userId: id,
                userType: role,
                amount: Number(amount),
                accessKey: accessKeys.subscriptions,
            });
            if (data) {
                const walletDetailData = data as SurchargeResponse;
                setSurchargeDetails(walletDetailData);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch surcharge :', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role, amount]);

    useEffect(() => {
        getSurchargeData();
    }, [getSurchargeData]);

    return { surchargeData: surchargeDetails, isLoading };
}

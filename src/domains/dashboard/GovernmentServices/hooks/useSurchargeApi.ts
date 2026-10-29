import { useCallback, useState } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import { serviceAccessKeyMap } from '../utils';

export default function useSurchargeApi(serviceId: number, amount: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeData, setSurchargeData] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(false);

    const fetchSurcharge = useCallback(async () => {
        const accessKey = serviceAccessKeyMap[serviceId];
        if (!accessKey || !amount) return;

        setIsLoading(true);
        const data = await getSurcharge({
            userId: id,
            userType: role,
            amount,
            accessKey,
        });
        setIsLoading(false);

        if (data) {
            setSurchargeData(data as SurchargeResponse);
        }
    }, [id, role, serviceId, amount]);

    return { surchargeData, isLoading, fetchSurcharge };
}

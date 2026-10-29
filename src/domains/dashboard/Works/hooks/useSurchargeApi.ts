import { useState } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export default function useSurchargeApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeDetails, setSurchargeDetails] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(false);

    const getSurchargeData = async (amount: number) => {
        setIsLoading(true);
        const data: SurchargeResponse | false = await getSurcharge({
            userId: id,
            userType: role,
            amount,
            accessKey: accessKeys.pekoWorks,
        });
        if (data) {
            const surchargeResult = data as SurchargeResponse;
            setSurchargeDetails(surchargeResult);
            setIsLoading(false);
            return surchargeResult;
        }
        setIsLoading(false);
        return false;
    };

    return { surchargeData: surchargeDetails, isLoading, getSurchargeData };
}

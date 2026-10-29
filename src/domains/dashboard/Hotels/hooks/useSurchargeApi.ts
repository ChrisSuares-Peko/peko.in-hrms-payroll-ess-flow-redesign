import { useCallback, useEffect, useState } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export default function GetSurcharge() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeDetails, setSurchargeDetails] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const { netAmount } = useAppSelector(state => state.reducer.hotels);
    const { totalFare } = netAmount;
    // const amount =
    //     roomResponse?.reduce((totalPrice, roomData) => totalPrice + Number(roomData?.price), 0) ??
    //     0;

    const getSurchargeData = useCallback(async () => {
        const data: SurchargeResponse | false = await getSurcharge({
            userId: id,
            userType: role,
            amount: Number(totalFare),
            accessKey: accessKeys.hotels,
        });
        if (data) {
            const walletDetailData = data as SurchargeResponse;
            setSurchargeDetails(walletDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, totalFare]);

    useEffect(() => {
        getSurchargeData();
    }, [getSurchargeData]);

    return { surchargeData: surchargeDetails, isLoading };
}

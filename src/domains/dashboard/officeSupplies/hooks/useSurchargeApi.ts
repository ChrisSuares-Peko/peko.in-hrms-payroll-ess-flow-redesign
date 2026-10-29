import { useCallback, useEffect, useState } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export default function GetSurcharge() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [surchargeDetails, setSurchargeDetails] = useState<SurchargeResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const { grandTotal, validation } = useAppSelector(state => state.reducer.cart);

    // The fee must be computed on the amount we actually charge. Once /select has
    // run, that is the sellers' validated quote total — not the local cart math —
    // because the payment payload carries validatedTotal as `amount` and the
    // backend re-derives the surcharge from it (validateAmount rejects any drift).
    const surchargeBasis = validation?.anyValidated ? validation.validatedTotal : grandTotal;

    const getSurchargeData = useCallback(async () => {
        const data: SurchargeResponse | false = await getSurcharge({
            userId: id,
            userType: role,
            amount: Number(surchargeBasis),
            accessKey: accessKeys.officeSupplies,
        });
        if (data) {
            const walletDetailData = data as SurchargeResponse;
            setSurchargeDetails(walletDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, surchargeBasis]);

    useEffect(() => {
        getSurchargeData();
    }, [getSurchargeData]);

    return { surchargeData: surchargeDetails, isLoading };
}

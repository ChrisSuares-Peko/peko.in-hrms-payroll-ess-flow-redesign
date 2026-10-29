import { useCallback } from 'react';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export default function GetSurcharge() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const getSurchargeData = useCallback(
        async (amount: string) => {
            const data: SurchargeResponse | false = await getSurcharge({
                userId: id,
                userType: role,
                amount: Number(amount),
                accessKey: accessKeys.pekoPos,
            });
            return data || null;
        },
        [id, role]
    );

    return { getSurchargeData };
}

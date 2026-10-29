import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';

export interface GovtServiceSurchargeResult {
    surcharge: number;
    corporateCashback: number;
}

// Dedicated surcharge hook — same role as giftCards' hooks/useSurchargeApi.ts
// (GetSurcharge). Exposes an on-demand fetch rather than auto-firing off a
// watched amount, since Gov Services' surcharge must only be resolved once
// the corporate actually clicks Continue (see useGovtServicePayment's
// proceedToPayment) — not while they're still browsing plan/pricing on the
// details page.
export default function useSurchargeApi() {
    const { role, id: userId } = useAppSelector((state) => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getGovtServiceSurcharge = useCallback(
        async (amount: number): Promise<GovtServiceSurchargeResult> => {
            setIsLoading(true);
            try {
                const data = await getSurcharge({
                    userId,
                    userType: role,
                    amount,
                    accessKey: accessKeys.governmentServices,
                });
                return {
                    surcharge: data ? Number(data.surcharge) || 0 : 0,
                    corporateCashback: data ? Number(data.corporateCashback) || 0 : 0,
                };
            } finally {
                setIsLoading(false);
            }
        },
        [userId, role]
    );

    return { getGovtServiceSurcharge, isLoading };
}

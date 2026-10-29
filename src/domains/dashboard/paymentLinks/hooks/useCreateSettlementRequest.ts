import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createSettlementRequest } from '../api';
import type { CreateSettlementRequestResponse } from '../types/paymentLinkTypes';

export default function useCreateSettlementRequest() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const submitSettlementRequest = useCallback(
        async ({
            amount,
            remarks,
            transferType = 'IMPS',
        }: {
            amount: number;
            remarks?: string;
            transferType?: 'IMPS' | 'NEFT';
        }): Promise<CreateSettlementRequestResponse | false> => {
            setLoading(true);
            const result = await createSettlementRequest({
                userId: id,
                userType: role,
                amount,
                remarks,
                transferType,
            });
            setLoading(false);
            return result;
        },
        [id, role]
    );

    return { loading, submitSettlementRequest };
}

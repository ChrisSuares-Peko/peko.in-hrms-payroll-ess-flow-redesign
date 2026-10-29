import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { sendUpiCollect } from '../api';
import { SendUpiCollectPayload, SendUpiCollectResponse } from '../types/paymentLinkTypes';

type SendUpiCollectInput = Omit<SendUpiCollectPayload, 'userId' | 'userType'>;

export const useSendUpiCollect = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const sendCollect = useCallback(
        async (payload: SendUpiCollectInput): Promise<SendUpiCollectResponse | false> => {
            setLoading(true);
            const response = await sendUpiCollect({
                userId: id,
                userType: role,
                ...payload,
            });
            setLoading(false);
            return response;
        },
        [id, role]
    );

    return { loading, sendCollect };
};

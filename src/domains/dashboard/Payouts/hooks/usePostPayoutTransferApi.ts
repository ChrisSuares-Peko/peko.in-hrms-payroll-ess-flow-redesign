import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postPayoutTransfer } from '../api';
import { PayoutTransferPayload } from '../types';

export default function usePostPayoutTransferApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const submitPayoutTransfer = async (payload: PayoutTransferPayload) => {
        setLoading(true);
        const res = await postPayoutTransfer(role, id, payload);
        setLoading(false);
        return res;
    };

    return { submitPayoutTransfer, isLoading };
}

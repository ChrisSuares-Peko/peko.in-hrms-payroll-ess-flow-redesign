import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postOtherBill } from '../api';
import { OtherBillPayload } from '../types';

export default function usePostOtherBillApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const submitOtherBill = async (payload: OtherBillPayload) => {
        setLoading(true);
        const res = await postOtherBill(role, id, payload);
        setLoading(false);
        return res;
    };

    return { submitOtherBill, isLoading };
}

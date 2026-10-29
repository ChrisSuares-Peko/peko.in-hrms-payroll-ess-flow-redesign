import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postRentBill } from '../api';
import { RentBillPayload } from '../types';

export default function usePostRentBillApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const submitRentBill = async (payload: RentBillPayload) => {
        setLoading(true);
        const res = await postRentBill(role, id, payload);
        setLoading(false);
        return res;
    };

    return { submitRentBill, isLoading };
}

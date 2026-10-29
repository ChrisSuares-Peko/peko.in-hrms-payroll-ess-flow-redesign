import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchAllPayouts } from '../api';
import { GetAllPayoutsParams, GetAllPayoutsResponse, PayoutTransaction } from '../types';

export default function useGetAllPayoutsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [data, setData] = useState<PayoutTransaction[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setLoading] = useState(false);

    const getAllPayouts = async (params?: GetAllPayoutsParams) => {
        setLoading(true);
        const res = await fetchAllPayouts(role, id, params);
        setLoading(false);
        if (res) {
            const payload = res as GetAllPayoutsResponse;
            setData(payload.data ?? []);
            setTotal(payload.pagination?.total ?? 0);
        }
    };

    return { getAllPayouts, data, total, isLoading };
}

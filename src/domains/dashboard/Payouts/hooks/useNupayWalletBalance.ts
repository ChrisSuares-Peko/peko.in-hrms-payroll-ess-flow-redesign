import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNupayWalletBalance } from '../api';
import { NupayWalletBalance } from '../types';

export default function useNupayWalletBalance() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<NupayWalletBalance | null>(null);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        const res = await getNupayWalletBalance(role, id);
        setData(res);
        setIsLoading(false);
    }, [role, id]);

    return {
        fetchBalance,
        isLoading,
        balance: data?.availableBalance != null ? parseFloat(data.availableBalance) : null,
        virtualAccountNumber: data?.vaAccountNumber ?? null,
        ifsc: data?.vaIfscCode ?? null,
    };
}

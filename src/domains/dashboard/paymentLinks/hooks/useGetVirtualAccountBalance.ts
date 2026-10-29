import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVirtualAccountBalance } from '../api';
import type { VirtualAccountBalanceData } from '../types/paymentLinkTypes';

export default function useGetVirtualAccountBalance() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [balanceData, setBalanceData] = useState<VirtualAccountBalanceData | null>(null);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        const data = await getVirtualAccountBalance({ userId: id, userType: role });
        setIsLoading(false);
        if (data) {
            setBalanceData(data);
        }
    }, [id, role]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        isLoading,
        balance: balanceData?.balance ?? null,
        accountName: balanceData?.accountName ?? null,
        virtualAccountNumber: balanceData?.virtualAccountNumber ?? null,
        ifsc: balanceData?.ifsc ?? null,
        fetchBalance,
    };
}

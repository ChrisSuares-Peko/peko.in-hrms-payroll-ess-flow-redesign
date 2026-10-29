import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVirtualAccountBalanceApi } from '../api/virtualAccount';
import { VirtualAccountBalance } from '../types/virtualAccount';

export const useGetVirtualAccountBalanceApi = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [balance, setBalance] = useState<VirtualAccountBalance | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        const resp = await getVirtualAccountBalanceApi({
            userId: id,
            userType: role,
        });
        setBalance(resp || null);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return { balance, isLoading, refetch: fetchBalance };
};

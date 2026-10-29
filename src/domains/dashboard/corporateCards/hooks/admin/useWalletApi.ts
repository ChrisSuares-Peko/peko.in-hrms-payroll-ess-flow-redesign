import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getWallet, WalletResponse } from '../../api/admin/walletApi';

export const useWalletApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [wallet, setWallet] = useState<WalletResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWallet = useCallback(async () => {
        setIsLoading(true);
        const res = await getWallet(role, id);
        if (res && res.data) setWallet(res.data);
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    return { wallet, isLoading, refetch: fetchWallet };
};

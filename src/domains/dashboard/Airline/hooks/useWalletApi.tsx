import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getWalletBalance } from '../api/index';
import { WalletBalanceResponse } from '../types/paymentTypes';

export default function useGetWalletDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [walletDetails, setWalletDetails] = useState<WalletBalanceResponse>();
    const [isLoading, setIsLoading] = useState(true);

    const getWalletDetails = useCallback(async () => {
        const data: WalletBalanceResponse | false = await getWalletBalance({
            userId: id,
            userType: role,
        });
        if (data) {
            const walletDetailData = data as WalletBalanceResponse;
            setWalletDetails(walletDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getWalletDetails();
    }, [getWalletDetails]);

    return { walletData: walletDetails, isLoading };
}

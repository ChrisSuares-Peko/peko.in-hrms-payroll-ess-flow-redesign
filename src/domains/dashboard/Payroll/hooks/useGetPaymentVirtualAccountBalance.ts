import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPaymentVirtualAccountBalance } from '../api/paymentAccount';
import { PaymentVirtualAccountBalanceData } from '../types/virtualAccount';

export const useGetPaymentVirtualAccountBalance = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [balanceData, setBalanceData] = useState<PaymentVirtualAccountBalanceData | null>(null);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        const data = await getPaymentVirtualAccountBalance({ userId: id, userType: role });
        setIsLoading(false);
        if (data) setBalanceData(data);
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
};

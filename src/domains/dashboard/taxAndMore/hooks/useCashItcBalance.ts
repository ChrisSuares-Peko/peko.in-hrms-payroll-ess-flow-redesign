import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCashItcBalance } from '../api/tax';
import { CashItcBalanceData } from '../types';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
}

const useCashItcBalance = (params: Params | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<CashItcBalanceData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [requiresAuth, setRequiresAuth] = useState(false);

    const fetch = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        setData(null);
        const resp = await getCashItcBalance({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) {
            setData(resp.data);
            setRequiresAuth(false);
        } else if (resp && !resp.status) {
            const d = resp.data as unknown as { requiresAuth?: boolean };
            setRequiresAuth(d?.requiresAuth === true);
        }
        setIsLoading(false);
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return {
        data,
        isLoading,
        requiresAuth,
        resetAuth: () => setRequiresAuth(false),
        refresh: fetch,
    };
};

export default useCashItcBalance;

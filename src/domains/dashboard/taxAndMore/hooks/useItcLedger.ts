import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getItcLedger } from '../api/tax';
import { ItcLedgerTransaction } from '../types';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
    from?: string;
    to?: string;
}

const useItcLedger = (params: Params | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [transactions, setTransactions] = useState<ItcLedgerTransaction[]>([]);
    const [credits, setCredits] = useState(0);
    const [debits, setDebits] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [requiresAuth, setRequiresAuth] = useState(false);

    const fetch = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        const resp = await getItcLedger({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
            ...(params.from ? { from: params.from } : {}),
            ...(params.to ? { to: params.to } : {}),
        });
        if (resp && resp.data) {
            if ((resp.data as any).requiresAuth) {
                setRequiresAuth(true);
            } else {
                setTransactions(resp.data.transactions ?? []);
                setCredits(resp.data.credits ?? 0);
                setDebits(resp.data.debits ?? 0);
                setRequiresAuth(false);
            }
        }
        setIsLoading(false);
    }, [id, role, params?.gstin, params?.financialYear, params?.month, params?.from, params?.to]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { transactions, credits, debits, isLoading, requiresAuth, refresh: fetch };
};

export default useItcLedger;

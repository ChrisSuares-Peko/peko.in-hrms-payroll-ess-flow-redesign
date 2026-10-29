import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchDomesticBankAccounts } from '../api';
import { DomesticBankAccount } from '../types';

export default function useGetDomesticBankAccountsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<DomesticBankAccount[]>([]);

    const getDomesticBankAccounts = async () => {
        setLoading(true);
        const res = await fetchDomesticBankAccounts(role, id);
        if (res) {
            setData(res);
        }
        setLoading(false);
    };

    return { getDomesticBankAccounts, data, isLoading };
}

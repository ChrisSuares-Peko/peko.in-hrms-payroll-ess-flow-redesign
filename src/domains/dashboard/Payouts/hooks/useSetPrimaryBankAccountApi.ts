import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { setPrimaryDomesticBankAccount } from '../api';

export default function useSetPrimaryBankAccountApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const setPrimaryBankAccount = async (accountId: number) => {
        setLoading(true);
        const res = await setPrimaryDomesticBankAccount(role, id, accountId);
        setLoading(false);
        return res;
    };

    return { setPrimaryBankAccount, isLoading };
}

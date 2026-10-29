import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteDomesticBankAccount } from '../api';

export default function useDeleteDomesticBankAccountApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const deleteBankAccount = async (accountId: number) => {
        setLoading(true);
        const res = await deleteDomesticBankAccount(role, id, accountId);
        setLoading(false);
        return res;
    };

    return { deleteBankAccount, isLoading };
}

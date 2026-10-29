import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { putDomesticBankAccount } from '../api';
import { AddDomesticBankAccountPayload } from '../types';

export default function useEditDomesticBankAccountApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const editDomesticBankAccount = async (accountId: number, payload: AddDomesticBankAccountPayload) => {
        setLoading(true);
        const res = await putDomesticBankAccount(role, id, accountId, payload);
        setLoading(false);
        return res;
    };

    return { editDomesticBankAccount, isLoading };
}

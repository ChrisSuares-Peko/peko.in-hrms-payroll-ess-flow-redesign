import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postDomesticBankAccount } from '../api';
import { AddDomesticBankAccountPayload } from '../types';

export default function useAddDomesticBankAccountApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const addDomesticBankAccount = async (payload: AddDomesticBankAccountPayload) => {
        setLoading(true);
        const res = await postDomesticBankAccount(role, id, payload);
        setLoading(false);
        return res;
    };

    return { addDomesticBankAccount, isLoading };
}

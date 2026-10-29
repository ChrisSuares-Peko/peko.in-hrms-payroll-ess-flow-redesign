import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { postBeneficiaryDetails } from '../api';
import { AddBeneficiaryPayload, Beneficiary } from '../types';

export default function useAddBeneficiaryApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<Beneficiary | null>(null);

    const addBeneficiary = async (payload: AddBeneficiaryPayload) => {
        setLoading(true);
        const res: Beneficiary | false = await postBeneficiaryDetails(role, id, payload);
        if (res) {
            setData(res);
        }
        setLoading(false);
        return res;
    };

    return { addBeneficiary, data, isLoading };
}

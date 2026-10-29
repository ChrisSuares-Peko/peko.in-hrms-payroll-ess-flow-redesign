import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { putBeneficiaryDetails } from '../api';
import { AddBeneficiaryPayload } from '../types';

export default function useEditBeneficiaryApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const editBeneficiary = async (beneficiaryId: number, payload: AddBeneficiaryPayload) => {
        setLoading(true);
        const res = await putBeneficiaryDetails(role, id, beneficiaryId, payload);
        setLoading(false);
        return res;
    };

    return { editBeneficiary, isLoading };
}

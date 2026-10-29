import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteBeneficiaryDetails } from '../api';

export default function useDeleteBeneficiaryApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const deleteBeneficiary = async (beneficiaryId: number) => {
        setLoading(true);
        const res = await deleteBeneficiaryDetails(role, id, beneficiaryId);
        setLoading(false);
        return res;
    };

    return { deleteBeneficiary, isLoading };
}

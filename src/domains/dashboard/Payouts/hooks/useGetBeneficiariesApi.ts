import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchBeneficiaryDetails } from '../api';
import { Beneficiary, GetBeneficiariesParams } from '../types';

export default function useGetBeneficiariesApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<Beneficiary[]>([]);

    const getBeneficiaries = async (params?: GetBeneficiariesParams) => {
        setLoading(true);
        const res = await fetchBeneficiaryDetails(role, id, params);
        if (res) {
            setData(res);
        }
        setLoading(false);
    };

    return { getBeneficiaries, data, isLoading };
}

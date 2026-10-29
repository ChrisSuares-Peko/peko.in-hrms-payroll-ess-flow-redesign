import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getReturnLiability } from '../api/tax';
import { ReturnLiabilityData } from '../types';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
}

const useReturnLiability = (params: Params | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<ReturnLiabilityData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        setData(null);
        const resp = await getReturnLiability({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) setData(resp.data);
        setIsLoading(false);
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, refresh: fetch };
};

export default useReturnLiability;

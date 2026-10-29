import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAddedBackLiabilities } from '../api/tax';
import { AddedBackLiability } from '../types';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
}

const useAddedBackLiabilities = (params: Params | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [liabilities, setLiabilities] = useState<AddedBackLiability[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        const data = await getAddedBackLiabilities({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (data) setLiabilities(data.liabilities);
        setIsLoading(false);
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { liabilities, isLoading };
};

export default useAddedBackLiabilities;

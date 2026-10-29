import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFilingHistory } from '../api/tax';
import { FilingHistoryEntry } from '../types';

const useFilingHistory = (params: { gstin: string; financialYear: string } | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<FilingHistoryEntry[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (params?.gstin && params?.financialYear) {
            setIsLoading(true);
            getFilingHistory({
                userId: id,
                userType: role,
                gstin: params.gstin,
                financialYear: params.financialYear,
            }).then(result => {
                if (!cancelled) {
                    setData(result || null);
                    setIsLoading(false);
                }
            });
        }
        return () => {
            cancelled = true;
        };
    }, [id, role, params?.gstin, params?.financialYear]);

    return { data, isLoading };
};

export default useFilingHistory;

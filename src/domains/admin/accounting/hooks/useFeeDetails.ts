import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { FeeDetailsQuery, FeeDetailsRow, getFeeDetails } from '../api/feeDetails';

export default function useFeeDetails(filters: FeeDetailsQuery) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<FeeDetailsRow[]>([]);
    const [count, setCount] = useState(0);

    const fetchRows = useCallback(async () => {
        setIsLoading(true);
        const data = await getFeeDetails({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.result || []);
            setCount(data.totalData || 0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { isLoading, tableData, count, refetch: fetchRows };
}

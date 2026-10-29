import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllChartofAccounts } from '../api/chartOfAccount';
import { getChartOfAccounts } from '../types/chartofAccount';

const useGetChartOfAccounts = (payload: getChartOfAccounts) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllChartofAccounts({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, payload]);

    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        setRefresh,
    };
};

export default useGetChartOfAccounts;

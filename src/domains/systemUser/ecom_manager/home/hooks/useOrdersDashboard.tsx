import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOrdersDashboard } from '../api/index';
import { TransactionInfo, transactionResponse } from '../types/types';

const useOrdersDashboard = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<TransactionInfo[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: transactionResponse | false = await getOrdersDashboard({
            userId: id,
            userType: role,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count };
};

export default useOrdersDashboard;

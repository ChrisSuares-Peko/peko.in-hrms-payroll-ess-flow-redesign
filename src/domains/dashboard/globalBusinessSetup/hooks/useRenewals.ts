import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRenewalData } from '../api/globalBusinessSetup';
import { getData } from '../types/globalBusinessSetup';

const useRenewals = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any>();

    const getAllRenewals = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getRenewalData({
            userId: id,
            userType: role,
            ...payload,
        });

        if (data) {
            setTableData(data.renewals);
            setCount(data.total);
        }

        setRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllRenewals();
    }, [getAllRenewals, refresh]);

    return { isLoading, tableData, count, refetch: () => setRefresh(true) };
};

export default useRenewals;

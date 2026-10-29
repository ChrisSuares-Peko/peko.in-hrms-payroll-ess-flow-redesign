import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOngoingData } from '../api/globalBusinessSetup';
import { getData } from '../types/globalBusinessSetup';

const useGetOngoingSetups = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any>();

    const getAllOngoingSetups = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getOngoingData({
            userId: id,
            userType: role,
            ...payload,
        });

        if (data) {
            setTableData(data.companies);
            setCount(data.total);
        }

        setRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllOngoingSetups();
    }, [getAllOngoingSetups, refresh]);

    return { isLoading, tableData, count };
};

export default useGetOngoingSetups;

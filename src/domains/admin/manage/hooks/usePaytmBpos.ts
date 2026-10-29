import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllData, updateStatus } from '../api/paytmBposApi';
import { DemoRequestsData, getData, DemoRequestsDataResponse } from '../types/types';

const usePaytmBpos = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<DemoRequestsData[]>();

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: DemoRequestsDataResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const updateBposStatus = async (value: { id: number; status: string }) => {
        const data = await updateStatus({
            itemId: value.id,
            status: value.status,
            userId: id,
            userType: role,
        });
        if (data) {
            getAllTableData();
        }
    };

    return { isLoading, tableData, count, getAllTableData, updateBposStatus };
};

export default usePaytmBpos;

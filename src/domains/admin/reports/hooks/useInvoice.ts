import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllData } from '../api/invoice';
import { getData } from '../types/index';
import { InvoiceDataResponse, InvoiceData } from '../types/invoice';

const useInvoice = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<InvoiceData[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: InvoiceDataResponse | false = await getAllData({
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

    return { isLoading, tableData, count };
};

export default useInvoice;

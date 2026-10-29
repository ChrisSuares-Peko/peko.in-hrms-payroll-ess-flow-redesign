import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllOndcOrders, getFileBufferReportReturnedOrders } from '../api/order';
import { AllOrdersRow, getData } from '../types/types';

/**
 * Returns tab — every ONDC order with return activity, live requests included.
 *
 * NOT status: "Returned": orderState only reaches that once a return liquidates, so
 * filtering on it hid every in-flight request (Return_Initiated/Approved/Picked leave
 * orderState at "Completed"). The server-side returnsOnly filter keys on returnStatus.
 */
const useReturnRequest = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<AllOrdersRow[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllOndcOrders({
            userId: id,
            userType: role,
            ...payload,
            returnsOnly: true,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, payload, role]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportReturnedOrders({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, `Return Requests.xlsx`);
            else if (type === 'csv') saveAs(blob, `Return Requests.csv`);
            else if (type === 'pdf') saveAs(blob, `Return Requests.pdf`);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count, getAllTableData, downloadReport };
};

export default useReturnRequest;

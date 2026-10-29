import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllOndcOrders, getFileBufferReportCancelledOrders } from '../api/order';
import { AllOrdersRow, getData } from '../types/types';

const useCancelAndRefunds = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<AllOrdersRow[]>();
    const [ondcOrders, setOndcOrders] = useState<AllOrdersRow[]>([]);
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllOndcOrders({
            userId: id,
            userType: role,
            ...payload,
            status:"Cancelled"
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
            setOndcOrders(data.data || []);
        }
        setIsLoading(false);
    }, [id, payload, role]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportCancelledOrders({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Cancel & Refunds.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Cancel & Refunds.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Cancel & Refunds.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, ondcOrders, count, getAllTableData, downloadReport };
};

export default useCancelAndRefunds;

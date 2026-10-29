import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport, updateWorkSpaceStatus } from '../api/workspace';
import { getData } from '../types/index';
import { TransactionInfo, TransactionInfoResp } from '../types/workspace';

const useWorkspace = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<TransactionInfo[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: TransactionInfoResp | false = await getAllData({
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

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
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
                saveAs(blob, `Workspace Orders Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Workspace Orders Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Workspace Orders Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    const updateStatus = async (orderId: string, workspaceOrderStatus: string) => {
        setIsLoading(true);
        await updateWorkSpaceStatus({
            userId: id,
            userType: role,
            id: orderId,
            workspaceOrderStatus,
        });
        setIsLoading(false);
    };

    return { isLoading, tableData, getAllTableData, count, downloadReport, updateStatus };
};

export default useWorkspace;

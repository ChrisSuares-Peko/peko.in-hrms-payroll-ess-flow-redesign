import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, getFileBufferReport, resendOrderEmail } from '../api/order';
import { getData } from '../types/index';
import { TransactionInfo, transactionResponse } from '../types/orders';

const useOrders = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<TransactionInfo[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: transactionResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.result);
            setCount(data.totalData);
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
                saveAs(blob, `Orders Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Orders Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Orders Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    const resendEmail = async (corporateTxnId: string) => {
        setIsLoading(true);
        const resp = await resendOrderEmail({ userId: id, userType: role, corporateTxnId });
        if (resp && resp.status) {
            dispatch(showToast({ description: 'Email resent successfully', variant: 'success' }));
        } else if (resp) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, downloadReport, resendEmail };
};

export default useOrders;

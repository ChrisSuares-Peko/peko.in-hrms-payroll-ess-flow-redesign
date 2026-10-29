import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getAllData, getExcelReport } from '../api/transactions';
import { getData } from '../types/index';
import { TransactionInfo, TransactionReportResp, TransactionsResp } from '../types/transactions';

const useTransactions = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<TransactionInfo[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: TransactionsResp | false = await getAllData({
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

    const downloadReport = async () => {
        setIsLoading(true);
        const data: TransactionReportResp | false = await getExcelReport({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            saveAs(blob, `TransactionReport.xlsx`);
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count, downloadReport };
};

export default useTransactions;

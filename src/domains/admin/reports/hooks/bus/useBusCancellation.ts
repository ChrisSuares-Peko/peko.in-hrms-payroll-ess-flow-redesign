import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport, refundApi } from '../../api/bus/bus';
import { getData } from '../../types';

const useBusCancellation = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<any[]>();

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllData({ ...payload, userId: id, userType: role });
        if (data) {
            setTableData(data.bookings);
            setCount(data.count ?? data.totalCount ?? 0);
        }
        setIsLoading(false);
    }, [payload, id, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            ...payload,
            userId: id,
            userType: role,
            type,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') {
                saveAs(blob, `Bus_Cancellation_Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Bus_Cancellation_Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Bus_Cancellation_Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    const refundAmount = async (payload2: {
        corporateTxnId: string;
        refundAmount: number;
    }): Promise<boolean> => {
        setModalLoading(true);
        const data: any | false = await refundApi({ ...payload2, userId: id, userType: role });
        setModalLoading(false);
        return !!data;
    };

    return {
        isLoading,
        modalLoading,
        tableData,
        count,
        downloadReport,
        getAllTableData,
        refundAmount,
    };
};

export default useBusCancellation;

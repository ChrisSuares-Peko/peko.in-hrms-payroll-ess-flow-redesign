import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport } from '../api/eSign';
import { eSignBody, eSignDataResponse } from '../types/eSign';
import { getData } from '../types/index';

const useEsign = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<eSignBody[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: eSignDataResponse | false = await getAllData({
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
                saveAs(blob, `eSign.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `eSign.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `eSign.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, downloadReport };
};

export default useEsign;

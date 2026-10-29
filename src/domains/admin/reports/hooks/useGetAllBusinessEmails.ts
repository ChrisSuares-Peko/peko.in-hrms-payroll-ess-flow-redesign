import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport } from '../api/businessEmail';
import { getData } from '../types/index';

const useGetAllBusinessEmails = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<any>(1);
    const [tableData, setTableData] = useState<any>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data && data.data.data) {
            setTableData(data.data.data);

            setCount(data.data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, payload, role]);

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
                saveAs(blob, `Business Email.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Business Email.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Business Email.pdf`);
            }
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count, downloadReport };
};

export default useGetAllBusinessEmails;

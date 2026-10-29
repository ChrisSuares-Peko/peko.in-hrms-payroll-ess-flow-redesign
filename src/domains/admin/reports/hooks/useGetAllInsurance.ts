import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport } from '../api/insurance';
import { getData } from '../types/index';

const useGetAllInsurance = (payload: getData) => {
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

        if (data && data.data) {
            setTableData(data.data);

            setCount(data.recordsFiltered);
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
                saveAs(blob, `Insurance Plans.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Insurance Plans.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Insurance Plans.pdf`);
            }
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return { isLoading, tableData, count, downloadReport };
};

export default useGetAllInsurance;

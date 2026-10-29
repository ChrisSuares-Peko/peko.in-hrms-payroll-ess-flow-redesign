import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllData } from '../api/globalBusinessSetup';
import { getData } from '../types/globalBusinessSetup';

const useGetGlobalBusinessSetup = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, SetRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            // setTableData(processedTableData);
            setTableData(data.companies);
            setCount(data.total);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData, refresh]);

    // const downloadReport = async (type: string) => {
    //     setIsLoading(true);
    //     const data: CommonFileBuffer | false = await getFileBufferReport({
    //         userId: id,
    //         userType: role,
    //         type,
    //         ...payload,
    //     });
    //     if (data) {
    //         const arrayBuffer = new Uint8Array(data.buffer.data);

    //         // Convert ArrayBuffer to Blob
    //         const blob = new Blob([arrayBuffer], {
    //             type: data.fileType,
    //         });

    //         // Trigger download
    //         if (type === 'excel') {
    //             saveAs(blob, `Attestations Report.xlsx`);
    //         } else if (type === 'csv') {
    //             saveAs(blob, `Attestations Report.csv`);
    //         } else if (type === 'pdf') {
    //             saveAs(blob, `Attestations Report.pdf`);
    //         }
    //     }
    //     setIsLoading(false);
    // };

    return { isLoading, tableData, count };
};

export default useGetGlobalBusinessSetup;

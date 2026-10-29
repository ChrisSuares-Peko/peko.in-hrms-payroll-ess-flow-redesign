import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllModificationData } from '../../api/airline/airline';
import { getFileBufferReport } from '../../api/airline/modification';
import { getData } from '../../types';

const useAirlineModification = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();
    const getAllTableData = useCallback(async () => {
 
        setIsLoading(true);
        const data: any | false = await getAllModificationData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.bookings);
            setCount(data.count);
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
                saveAs(blob, `Modification_Requests_Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Modification_Requests_Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Modification_Requests_Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return {
        isLoading,
        tableData,
        count,
        downloadReport,
        getAllTableData,
    };
};

export default useAirlineModification;

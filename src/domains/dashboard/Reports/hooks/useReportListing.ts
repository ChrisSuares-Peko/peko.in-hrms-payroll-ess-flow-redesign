import { useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReport } from '../api/index';
import { filterState } from '../types/index';

const useReportExcelCSVPDFListing = (payload: filterState, title: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orderLoading, setIsOrderLoading] = useState(false);

    const downloadReport = async (type: string, isCashbackTable?: boolean) => {
        setIsOrderLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            title,
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
                saveAs(blob, `${isCashbackTable ? 'Cashback' : 'Transaction'} Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `${isCashbackTable ? 'Cashback' : 'Transaction'} Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `${isCashbackTable ? 'Cashback' : 'Transaction'} Report.pdf`);
            }
        }
        setIsOrderLoading(false);
    };

    return { orderLoading, downloadReport };
};

export default useReportExcelCSVPDFListing;

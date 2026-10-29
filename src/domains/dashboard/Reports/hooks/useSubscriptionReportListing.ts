import { useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getSubscriptionFileBufferReport } from '../api/index';
import { filterState } from '../types/index';

const useSubscriptionReportListing = (payload: filterState, title: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const downloadReport = async (type: string, isCashbackTable?: boolean) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getSubscriptionFileBufferReport({
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
                saveAs(blob, `Subscription Transactions Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Subscription Transactions Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Subscription Transactions Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, downloadReport };
};

export default useSubscriptionReportListing;

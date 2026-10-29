import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport } from '../api/pekoSubscriptions';
import { getData } from '../types/index';
import { subscriptionResponse, Subscription } from '../types/pekoSubscription';

const useSubscriptionListing = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, SetRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Subscription[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: subscriptionResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData, refresh]);

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
                saveAs(blob, `Subscription Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Subscription Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Subscription Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, downloadReport };
};

export default useSubscriptionListing;

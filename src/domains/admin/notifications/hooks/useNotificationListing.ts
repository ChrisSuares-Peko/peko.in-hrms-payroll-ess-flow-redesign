import { useState, useCallback, useEffect } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getFileBufferReport, notificationListing } from '../api/index';
import { filterState, NotificationData, NotificationsResponse } from '../types/index';

export const useNotificationListingApi = (payload: filterState) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableDetails, setTableDetails] = useState<NotificationData[]>([]);
    const [count, setCount] = useState<number>();
    // const [refresh, SetRefresh] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const handleRefresh = () => {
        // SetRefresh(prev => !prev);
        getNotificationList();
    };

    const getNotificationList = useCallback(async () => {
        setIsLoading(true);
        const data: NotificationsResponse | false = await notificationListing({
            userId: id,
            userType: role,
            ...payload,
        });

        if (data) {
            const listingData = data;

            const arr = listingData;

            setTableDetails(arr.data);
            setCount(listingData.recordsTotal);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, payload]);

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
                saveAs(blob, `Notifications.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Notifications.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Notifications.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getNotificationList();
    }, [getNotificationList]);

    return {
        data: tableDetails,
        isLoading,
        count,
        getNotificationList,
        handleRefresh,
        downloadReport,
    };
};

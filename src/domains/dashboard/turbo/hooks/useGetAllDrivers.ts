import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { deleteDriver, getAllDrivers, getFileBufferDriverReport } from '../api/index';

export default function useGetAllDriversApi({
    searchText,
    category,
    sort,
    page,
    itemsPerPage,
    filter,
    from,
    to,
    sortField,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [drivers, setDrivers] = useState<any>([]);
    const [allData, setAllData] = useState<any>([]);
    const [count, setCount] = useState<number>(1);
    const [refresh, setRefresh] = useState<boolean>(false);
    const geFleets = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllDrivers({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            page,
            itemsPerPage,
        });

        if (data) {
            const arr = data?.data?.map((values: any) => ({
                driverId: values.id,
                dlNumber: values.dlNumber,
                name: values.name,
            }));
            setAllData(data.data);
            setDrivers(arr);
            setCount(data.recordsTotal);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
        setRefresh(false);
    }, [id, role, from, to, searchText, page, itemsPerPage]);
    const deleteDriverApi = useCallback(
        async (payloads: any) => {
            try {
                const data: any = await deleteDriver({
                    userId: id,
                    userType: role,
                    id: payloads.id,
                });
                if (data) {
                    setRefresh(true);
                }
                return data;
                // Returning the data directly from the API call
            } catch (error) {
                console.error('Error in API call:', error);
                return null; // Return null or handle error as needed
            }
        },
        [id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferDriverReport({
            userId: id,
            userType: role,
            type,
            from,
            to,
            searchText,
            page,
            itemsPerPage,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Drivers Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Drivers Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Drivers Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        geFleets();
    }, [geFleets, refresh]);

    return { isLoading, drivers, count, allData, deleteDriverApi, setRefresh, downloadReport };
}

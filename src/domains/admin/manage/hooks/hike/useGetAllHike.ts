import { useCallback, useEffect, useState } from 'react';

import saveAs from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllHikeData, getHikeReport, updateHike } from '../../api/hike';

export default function useGetAllHike({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
    partnerId,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();

    const getHike = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllHikeData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
            partnerId,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField, partnerId]);

    const updateActiveStatusHike = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateHike({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );
    const downloadReport = async (type: 'excel' | 'csv' | 'pdf') => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getHikeReport({
            userId: id,
            userType: role,
            type,
            searchText,
            sort,
            sortField,
            partnerId,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Hike.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Hike.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Hike.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getHike();
    }, [getHike, refresh]);

    return {
        tableData,
        loading: isLoading,
        count,
        setRefresh,
        updateActiveStatusHike,
        downloadReport,
    };
}

import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getCollectorKybData, getFileBufferReport } from '../../api/collectorKyb';
import {
    collectorKybListResponse,
    Records,
    collectorKybListPayload,
} from '../../types/collectorKyb';

export default function useGetCollectorKyb({
    searchText,
    pageSize,
    page,
    sort,
    sortField,
}: collectorKybListPayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Records[]>();

    const getCollectorKyb = useCallback(async () => {
        setIsLoading(true);
        const data: collectorKybListResponse | false = await getCollectorKybData({
            userId: id,
            userType: role,
            searchText,
            pageSize,
            page,
            sort,
            sortField,
        });

        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, page, pageSize, role, searchText, sort, sortField]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            pageSize,
            page,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Collector KYB.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Collector KYB.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Collector KYB.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getCollectorKyb();
    }, [getCollectorKyb, refresh]);

    return { tableData, loading: isLoading, count, setRefresh, downloadReport };
}

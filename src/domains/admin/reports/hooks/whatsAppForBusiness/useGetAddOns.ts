import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAddOnData, getFileBufferReport } from '../../api/addOns';
import { AddOnsPayload, AddOnsResponse, Record } from '../../types/addOns';

export default function useGetAddOnData({
    searchText,
    pageSize,
    category,
    page,
    sort,
    sortField,
    from,
    to,
}: AddOnsPayload) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [tableData, setTableData] = useState<Record[]>([]);
    const [count, setCount] = useState<number>(0);
    const [refresh, setRefresh] = useState<boolean>(false);

    const fetchAddOnData = useCallback(async () => {
        setIsLoading(true);
        const data: AddOnsResponse | false = await getAddOnData({
            userType: role,
            userId: id,
            searchText,
            pageSize,
            category,
            page,
            sort,
            sortField,
            from,
            to,
        });

        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, searchText, pageSize, page, sort, sortField, from, to, category]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            category,
            searchText,
            pageSize,
            page,
            from,
            to,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `WhatsApp Add ons.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `WhatsApp Add ons.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `WhatsApp Add ons.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAddOnData();
    }, [fetchAddOnData, refresh]);

    return { tableData, isLoading, count, setRefresh, downloadReport };
}

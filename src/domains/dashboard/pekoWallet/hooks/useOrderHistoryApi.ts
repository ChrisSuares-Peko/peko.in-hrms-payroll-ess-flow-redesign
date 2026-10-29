import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllTransaction, getFileBufferReport } from '../api/index';

export default function useOrderHistoryApi({
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
    const [history, setHistory] = useState<any>([]);
    const [count, setCount] = useState<number>(1);
    const getHistory = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllTransaction({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
            sortField,
        });

        if (data) {
            setHistory(data.data);
            setCount(data.recordsTotal);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, searchText, sort, page, itemsPerPage, filter, sortField]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            category,
            sort,
            page,
            itemsPerPage,
            filter,
            from,
            to,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Wallet Transactions History.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Wallet Transactions History.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Wallet Transactions History.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getHistory();
    }, [getHistory]);

    return { isLoading, history, count, downloadReport };
}

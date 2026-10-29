import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';

import {
    downloadAdminGlobalBusinessSetupApplications,
    listAdminGlobalBusinessSetupApplications,
} from '../../api/globalBusinessSetup';

interface Filters {
    page: number;
    itemsPerPage: number;
    searchText: string;
    sort: 'ASC' | 'DESC';
    isPaid?: boolean;
}

const useAdminGlobalBusinessSetupApplications = (filters: Filters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const debouncedSearch = useDebounce(filters.searchText, 300);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        const res = await listAdminGlobalBusinessSetupApplications({
            userId: id,
            userType: role,
            page: filters.page,
            itemsPerPage: filters.itemsPerPage,
            searchText: debouncedSearch,
            sort: filters.sort,
            isPaid: filters.isPaid,
        });
        if (res && Array.isArray((res as any).applications)) {
            setRows((res as any).applications);
            setTotal((res as any).total ?? 0);
        } else {
            setRows([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [
        id,
        role,
        filters.page,
        filters.itemsPerPage,
        debouncedSearch,
        filters.sort,
        filters.isPaid,
    ]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const downloadReport = useCallback(
        async (type: 'excel' | 'csv' | 'pdf') => {
            setIsDownloading(true);
            const res: CommonFileBuffer | false = await downloadAdminGlobalBusinessSetupApplications({
                userId: id,
                userType: role,
                type,
                searchText: debouncedSearch,
                sort: filters.sort,
                isPaid: filters.isPaid,
            });
            if (res && res.buffer?.data && res.fileType) {
                const blob = new Blob([new Uint8Array(res.buffer.data)], {
                    type: res.fileType,
                });
                const ext = type === 'excel' ? 'xlsx' : type;
                saveAs(blob, `Global Business Setup - Applications.${ext}`);
            }
            setIsDownloading(false);
        },
        [id, role, debouncedSearch, filters.sort, filters.isPaid]
    );

    return { rows, total, isLoading, isDownloading, refetch: fetch, downloadReport };
};

export default useAdminGlobalBusinessSetupApplications;

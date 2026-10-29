import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';

import { downloadAdminGlobalBusinessSetupRenewals, listAdminGlobalBusinessSetupRenewals } from '../../api/globalBusinessSetup';

interface Filters {
    page: number;
    itemsPerPage: number;
    searchText: string;
    sort: 'ASC' | 'DESC';
}

const useAdminGlobalBusinessSetupRenewals = (filters: Filters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const debouncedSearch = useDebounce(filters.searchText, 300);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        const res = await listAdminGlobalBusinessSetupRenewals({
            userId: id,
            userType: role,
            page: filters.page,
            itemsPerPage: filters.itemsPerPage,
            searchText: debouncedSearch,
            sort: filters.sort,
        });
        if (res && Array.isArray((res as any).renewals)) {
            setRows((res as any).renewals);
            setTotal((res as any).total ?? 0);
        } else {
            setRows([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [id, role, filters.page, filters.itemsPerPage, debouncedSearch, filters.sort]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const downloadReport = useCallback(
        async (type: 'excel' | 'csv' | 'pdf') => {
            setIsDownloading(true);
            const res: CommonFileBuffer | false = await downloadAdminGlobalBusinessSetupRenewals({
                userId: id,
                userType: role,
                type,
                searchText: debouncedSearch,
                sort: filters.sort,
            });
            if (res && res.buffer?.data && res.fileType) {
                const blob = new Blob([new Uint8Array(res.buffer.data)], {
                    type: res.fileType,
                });
                const ext = type === 'excel' ? 'xlsx' : type;
                saveAs(blob, `Global Business Setup - Renewals.${ext}`);
            }
            setIsDownloading(false);
        },
        [id, role, debouncedSearch, filters.sort]
    );

    return { rows, total, isLoading, isDownloading, refetch: fetch, downloadReport };
};

export default useAdminGlobalBusinessSetupRenewals;

import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getCatalogData,
    syncCatalog,
    updateCatalogStatus,
} from '../api/businessRegistrationCatalog';
import {
    CatalogGetParams,
    CatalogRow,
    CatalogStatusPayload,
} from '../types/businessRegistrationCatalog';

const useGetBusinessRegistrationCatalog = ({ searchText, itemsPerPage, page, sort }: CatalogGetParams) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<CatalogRow[]>();

    const handleRefresh = () => setRefresh(prev => !prev);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data = await getCatalogData({ userId: id, userType: role, searchText, itemsPerPage, page, sort });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, searchText, itemsPerPage, page, sort, refresh]);

    const updateActiveStatus = useCallback(
        async ({ id: rowId, status }: CatalogStatusPayload) => {
            const data = await updateCatalogStatus({ userId: id, userType: role, id: rowId, status });
            if (data) handleRefresh();
        },
        [id, role]
    );

    const syncFromVendor = useCallback(async () => {
        setIsSyncing(true);
        const data = await syncCatalog({ userId: id, userType: role });
        setIsSyncing(false);
        dispatch(
            showToast({
                description: data ? 'Catalog synced from vendor' : 'Could not sync catalog',
                variant: data ? 'success' : 'error',
            })
        );
        if (data) handleRefresh();
    }, [id, role, dispatch]);

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, isSyncing, tableData, count, handleRefresh, updateActiveStatus, syncFromVendor };
};

export default useGetBusinessRegistrationCatalog;

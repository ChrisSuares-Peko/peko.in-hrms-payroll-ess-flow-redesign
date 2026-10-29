import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllGovtServices,
    syncGovtServicesCatalog,
    updateGovtServiceStatus,
} from '../api/govtServicesApi';
import { GovtService, GovtServiceData, GovtServiceFilters, GovtServiceUpdateStatus } from '../types/govtServicesTypes';

const useGetGovtServices = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: GovtServiceFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<GovtService[]>();

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: GovtServiceData | false = await getAllGovtServices({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);

    const updateActiveStatus = useCallback(
        async ({ id: serviceId, status }: GovtServiceUpdateStatus) => {
            setIsLoading(true);
            const data = await updateGovtServiceStatus({
                userId: id,
                userType: role,
                id: serviceId,
                status,
            });
            if (data) {
                setRefresh(true);
            } else {
                setIsLoading(false);
            }
        },
        [id, role]
    );

    const handleToggleStatus = useCallback(
        (record: GovtService) => {
            updateActiveStatus({ id: record.id, status: !record.status });
        },
        [updateActiveStatus]
    );

    const syncFromVendor = useCallback(async () => {
        setIsSyncing(true);
        const resp = await syncGovtServicesCatalog({ userId: id, userType: role });
        setIsSyncing(false);
        dispatch(
            showToast({
                description: resp ? resp.message : 'Could not sync catalog',
                variant: resp ? 'success' : 'error',
            })
        );
        if (resp) setRefresh(true);
    }, [id, role, dispatch]);

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        isSyncing,
        tableData,
        count,
        setRefresh,
        handleToggleStatus,
        syncFromVendor,
        dispatch,
    };
};

export default useGetGovtServices;

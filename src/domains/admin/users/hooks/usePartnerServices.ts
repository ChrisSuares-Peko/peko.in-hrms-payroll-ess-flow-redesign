import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPermissionsApi, getpartner } from '../api';
import {
    deletePartnerServiceAccess,
    getPartnerServiceAccess,
    patchPartnerServiceAccessStatus,
    postPartnerServiceAccess,
} from '../api/partner';
import {
    PartnerOption,
    PartnerServiceAccessRow,
    PartnerServicesFilters,
} from '../types/partnerServices';

const usePartnerServices = ({ page, itemsPerPage, searchText }: PartnerServicesFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [listLoading, setListLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<PartnerServiceAccessRow[]>();

    const [modalLoading, setModalLoading] = useState(false);
    const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
    const [baseRoles, setBaseRoles] = useState<any[]>([]);
    const [initialRoles, setInitialRoles] = useState<any[]>([]);

    const fetchList = useCallback(async () => {
        setListLoading(true);
        const data = await getPartnerServiceAccess({
            userId: id,
            userType: role,
            page,
            itemsPerPage,
            searchText,
        });
        if (data) {
            setTableData(data.rows ?? []);
            setCount(data.count ?? 0);
        }
        setRefresh(false);
        setListLoading(false);
    }, [id, role, page, itemsPerPage, searchText]);

    const deleteServiceAccess = useCallback(
        async (recordId: number) => {
            setListLoading(true);
            const data = await deletePartnerServiceAccess({
                userId: id,
                userType: role,
                id: recordId,
            });
            if (data && data.status) {
                dispatch(showToast({ description: data.message, variant: 'success' }));
                setRefresh(true);
            }
            setListLoading(false);
        },
        [id, role, dispatch]
    );

    const updateServiceStatus = useCallback(
        async (recordId: number, status: boolean) => {
            const data = await patchPartnerServiceAccessStatus({
                userId: id,
                userType: role,
                id: recordId,
                status,
            });
            if (data && data.status) {
                dispatch(showToast({ description: data.message, variant: 'success' }));
                setTableData(prev =>
                    prev?.map(row => (row.id === recordId ? { ...row, status } : row))
                );
            }
        },
        [id, role, dispatch]
    );

    const fetchPartners = useCallback(
        async (query = '') => {
            const data = await getpartner({ userId: id, userType: role, searchText: query });
            if (data && data.data) {
                setPartnerOptions(
                    data.data.map((item: any) => ({ value: item.id, label: item.name }))
                );
            }
        },
        [id, role]
    );

    const fetchInitialRoles = useCallback(async () => {
        setModalLoading(true);
        const data = await getPermissionsApi({ userId: id, userType: role });
        if (data && data.permissions) {
            setBaseRoles(data.permissions);
            setInitialRoles(data.permissions);
        }
        setModalLoading(false);
    }, [id, role]);

    const resetInitialRoles = useCallback(() => {
        setInitialRoles(baseRoles);
    }, [baseRoles]);

    const fetchExistingAccess = useCallback(
        async (partnerId: number) => {
            setModalLoading(true);
            const data = await getPartnerServiceAccess({
                userId: id,
                userType: role,
                partnerId,
            });
            const permissions = data && data.rows?.[0]?.permissions;
            if (permissions) {
                setInitialRoles(permissions);
            }
            setModalLoading(false);
        },
        [id, role]
    );

    const assignServiceAccess = useCallback(
        async (partnerId: number, permissions: any[]) => {
            setModalLoading(true);
            const data = await postPartnerServiceAccess({
                userId: id,
                userType: role,
                partnerId,
                permissions,
            });
            setModalLoading(false);
            return data;
        },
        [id, role]
    );

    useEffect(() => {
        fetchList();
    }, [fetchList, refresh]);

    useEffect(() => {
        fetchPartners();
        fetchInitialRoles();
    }, [fetchPartners, fetchInitialRoles]);

    return {
        listLoading,
        tableData,
        count,
        setRefresh,
        deleteServiceAccess,
        updateServiceStatus,
        modalLoading,
        partnerOptions,
        initialRoles,
        fetchPartners,
        fetchExistingAccess,
        assignServiceAccess,
        resetInitialRoles,
    };
};

export default usePartnerServices;

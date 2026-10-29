import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createMobileRechargeProvider,
    deleteMobileRechargeProvider,
    getAllMobileRechargeProviders,
    updateMobileRechargeProvider,
    updateMobileRechargeProviderStatus,
} from '../api/mobileRechargeProviders';
import {
    activeResponse,
    createMobileRechargeProviderPayload,
    getMobileRechargeProvidersPayload,
    MobileRechargeProviderData,
    MobileRechargeProviderResponse,
    updateMobileRechargeProviderPayload,
} from '../types/mobileRechargeProviderTypes';

const useMobileRechargeProviders = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getMobileRechargeProvidersPayload) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<MobileRechargeProviderData[]>();

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: MobileRechargeProviderResponse | false = await getAllMobileRechargeProviders({
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
    }, [id, searchText, itemsPerPage, page, sort, sortField, role]);

    const deleteProvider = useCallback(
        async (providerId: number) => {
            setIsLoading(true);
            const data: activeResponse | false = await deleteMobileRechargeProvider({
                userId: id,
                userType: role,
                providerId,
            });
            const { message } = data as any;
            setIsLoading(false);
            if (data) {
                dispatch(
                    showToast({
                        description: `${message}`,
                        variant: 'success',
                    })
                );
                return data;
            }
            return false;
        },
        [id, role, dispatch]
    );

    const updateStatus = useCallback(
        async (providerId: number, status: boolean) => {
            setIsLoading(true);
            const data: activeResponse | false = await updateMobileRechargeProviderStatus({
                userId: id,
                userType: role,
                id: providerId,
                status: !status,
            });
            const { message } = data as any;
            setIsLoading(false);
            if (data) {
                dispatch(
                    showToast({
                        description: `${message}`,
                        variant: 'success',
                    })
                );
                return data;
            }
            return false;
        },
        [id, role, dispatch]
    );

    const createProvider = useCallback(
        async (providerPayload: createMobileRechargeProviderPayload) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<MobileRechargeProviderData> | false =
                await createMobileRechargeProvider({
                    userId: id,
                    userType: role,
                    ...providerPayload,
                });
            setIsLoading(false);
            if (data) {
                return data;
            }
            return false;
        },
        [id, role]
    );

    const updateProvider = useCallback(
        async (providerPayload: updateMobileRechargeProviderPayload) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<MobileRechargeProviderData> | false =
                await updateMobileRechargeProvider({
                    userId: id,
                    userType: role,
                    ...providerPayload,
                });

            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateProvider,
        deleteProvider,
        createProvider,
        updateStatus,
        setRefresh,
    };
};

export default useMobileRechargeProviders;

import { useState, useEffect, useCallback } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllCustomers, getCustomerDashboard } from '../../api/customers';
import {
    CustomerStats,
    GetAllCustomersPayload,
    GetAllCustomersResponse,
    TopCustomerBase,
} from '../../types/customer';

const useCustomerData = (filters: GetAllCustomersPayload) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [customerList, setCustomerList] = useState<GetAllCustomersResponse>();
    const [stats, setStats] = useState<CustomerStats>({
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        avgTransaction: 0,
    });
    const [topByRevenue, setTopByRevenue] = useState<TopCustomerBase[]>([]);
    const [topByTxn, setTopByTxn] = useState<TopCustomerBase[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const fetchCustomerList = useCallback(async () => {
        setIsLoading(true);
        const resp = await getAllCustomers({ userId: id, userType: role, ...filters });
        if (resp && resp.status) {
            setCustomerList(resp.data);
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        } else if (!resp) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching customers.',
                    variant: 'error',
                })
            );
        }
        setRefresh(false);
        setIsLoading(false);
    }, [dispatch, id, role, filters]);

    const fetchDashboard = useCallback(async () => {
        setIsDashboardLoading(true);
        const resp = await getCustomerDashboard({ userId: id, userType: role });
        if (resp && resp.status) {
            const d = resp.data;
            setStats({
                totalCustomers: d.totalCustomers,
                activeCustomers: d.activeCustomers,
                totalRevenue: d.totalRevenue,
                avgTransaction: d.avgTransaction,
            });
            setTopByRevenue(d.topByRevenue);
            setTopByTxn(d.topByTransactions);
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsDashboardLoading(false);
    }, [id, role, dispatch]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard, refresh]);

    useEffect(() => {
        fetchCustomerList();
    }, [fetchCustomerList, refresh]);

    return {
        customerList,
        stats,
        topByRevenue,
        topByTxn,
        isLoading,
        isDashboardLoading,
        setRefresh,
    };
};

export default useCustomerData;

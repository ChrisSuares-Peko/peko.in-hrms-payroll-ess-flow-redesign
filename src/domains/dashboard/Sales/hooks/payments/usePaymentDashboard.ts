import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getDueThisWeekApi,
    getPaymentDashboard,
    getRecentActivityApi,
    getTopCustomersApi,
} from '../../api/payments';
import { PaymentDashboardData, RankingData } from '../../types/payments';

dayjs.extend(relativeTime);

const ITEMS_PER_PAGE = 5;

const usePaymentDashboard = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [overView, setOverView] = useState<PaymentDashboardData | null>(null);
    const [isOverViewLoading, setIsOverViewLoading] = useState(true);

    const [dueData, setDueData] = useState<RankingData[]>([]);
    const [isDueLoading, setIsDueLoading] = useState(true);

    const [topCustomers, setTopCustomers] = useState<RankingData[]>([]);
    const [isTopCustomersLoading, setIsTopCustomersLoading] = useState(true);

    const [recentActivity, setRecentActivity] = useState<RankingData[]>([]);
    const [isRecentActivityLoading, setIsRecentActivityLoading] = useState(true);
    const [recentActivityPage, setRecentActivityPage] = useState(1);
    const [recentActivityTotal, setRecentActivityTotal] = useState(0);

    const fetchOverView = useCallback(async () => {
        setIsOverViewLoading(true);
        const data = await getPaymentDashboard({ userId: id, userType: role });
        if (!data) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching payment data.',
                    variant: 'error',
                })
            );
        } else {
            setOverView(data);
        }
        setIsOverViewLoading(false);
    }, [dispatch, id, role]);

    const fetchDueThisWeek = useCallback(async () => {
        setIsDueLoading(true);
        const data = await getDueThisWeekApi({
            userId: id,
            userType: role,
            page: 1,
            itemsPerPage: ITEMS_PER_PAGE,
        });
        if (data) {
            setDueData(
                data.dueThisWeek.map(item => ({
                    id: item.id,
                    name: item.name,
                    dueDate: item.dueDate,
                    amount: item.amountDue,
                }))
            );
        }
        setIsDueLoading(false);
    }, [id, role]);

    const fetchTopCustomers = useCallback(async () => {
        setIsTopCustomersLoading(true);
        const data = await getTopCustomersApi({ userId: id, userType: role });
        if (data) {
            setTopCustomers(
                data.topCustomers.map((item, i) => ({
                    id: i + 1,
                    name: item.name,
                    totalRevenue: parseFloat(item.totalPaid),
                }))
            );
        }
        setIsTopCustomersLoading(false);
    }, [id, role]);

    const fetchRecentActivity = useCallback(
        async (page: number) => {
            setIsRecentActivityLoading(true);
            const data = await getRecentActivityApi({
                userId: id,
                userType: role,
                page,
                itemsPerPage: ITEMS_PER_PAGE,
            });
            if (data) {
                setRecentActivity(
                    data.recentActivity.map((item, i) => ({
                        id: i + 1,
                        name: item.customerName,
                        subtitle: item.label,
                        amount: item.amount,
                        time: dayjs(item.timestamp).fromNow(),
                    }))
                );
                setRecentActivityTotal(data.recordsTotal);
            }
            setIsRecentActivityLoading(false);
        },
        [id, role]
    );

    const handleRecentActivityPageChange = useCallback(
        (page: number) => {
            setRecentActivityPage(page);
            fetchRecentActivity(page);
        },
        [fetchRecentActivity]
    );

    useEffect(() => {
        fetchOverView();
        fetchDueThisWeek();
        fetchTopCustomers();
        fetchRecentActivity(1);
    }, [fetchOverView, fetchDueThisWeek, fetchTopCustomers, fetchRecentActivity]);

    return {
        overView,
        isOverViewLoading,
        dueData,
        isDueLoading,
        topCustomers,
        isTopCustomersLoading,
        recentActivity,
        isRecentActivityLoading,
        recentActivityPage,
        recentActivityTotal,
        recentActivityItemsPerPage: ITEMS_PER_PAGE,
        onRecentActivityPageChange: handleRecentActivityPageChange,
    };
};

export default usePaymentDashboard;

import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPayoutOnboardingList, updatePayoutOnboardingStatus } from '../api/payoutOnboarding';
import {
    AdminPayoutOnboardingRecord,
    PayoutOnboardingListPayload,
    UpdatePayoutOnboardingStatusPayload,
} from '../types/payoutOnboarding';

const usePayoutOnboarding = (filters: PayoutOnboardingListPayload) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<AdminPayoutOnboardingRecord[]>();

    const handleRefresh = () => setRefresh(prev => !prev);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data = await getPayoutOnboardingList({
            userId: id,
            userType: role,
            ...filters,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        id,
        role,
        filters.page,
        filters.itemsPerPage,
        filters.searchText,
        filters.sort,
        filters.sortField,
        filters.from,
        filters.to,
    ]);

    const updateStatus = useCallback(
        async ({ onboardingId, status }: UpdatePayoutOnboardingStatusPayload) => {
            setIsLoading(true);
            const result = await updatePayoutOnboardingStatus({
                userId: id,
                userType: role,
                onboardingId,
                status,
            });
            if (result) {
                handleRefresh();
                dispatch(
                    showToast({
                        description: 'Status updated successfully',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, handleRefresh, updateStatus };
};

export default usePayoutOnboarding;

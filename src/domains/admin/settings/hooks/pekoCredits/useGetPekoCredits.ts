import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    bulkUpdatePekoCreditsStatus,
    deletePekoCreditsApi,
    getAllCouponCodeData,
    updateCouponCodeStatus,
} from '../../api/pekoCredits';
import { Coupon, getCoupon, PekoCreditStatus, updateStatus } from '../../types/pekoCredits';

const useGetSubscriptionCoupon = (payload: getCoupon) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Coupon[]>();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllCouponCodeData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, payload]);

    const updateActiveStatus = useCallback(
        async ({ couponId, status }: updateStatus) => {
            setIsLoading(true);
            const data = await updateCouponCodeStatus({
                userId: id,
                userType: role,
                couponId,
                status,
            });
            if (data) {
                setRefresh(!refresh);
            }
            setIsLoading(false);
        },
        [id, role, refresh]
    );

    /**
     * Staging-only: enables or disables every peko credit in one call. Expired
     * coupons stay DISABLED even on an ACTIVE sweep, so the reported count can
     * be lower than the table total.
     */
    const bulkUpdateActiveStatus = useCallback(
        async (status: PekoCreditStatus) => {
            setIsLoading(true);
            const data = await bulkUpdatePekoCreditsStatus({
                userId: id,
                userType: role,
                status,
            });
            setIsLoading(false);

            if (!data) {
                dispatch(
                    showToast({
                        description: 'Something went wrong while updating peko credits',
                        variant: 'error',
                    })
                );
                return;
            }

            dispatch(
                showToast({
                    description: `${data.updatedCount} peko credit(s) ${
                        status === 'ACTIVE' ? 'enabled' : 'disabled'
                    }`,
                    variant: 'success',
                })
            );
            setRefresh(prev => !prev);
        },
        [id, role, dispatch]
    );

    const handleDeleteCoupon = async (couponId: number) => {
        setIsLoading(true);
        const response: {} | false = await deletePekoCreditsApi({
            userId: id,
            userType: role,
            couponId,
        });
        setIsLoading(false);
        if (response) {
            dispatch(
                showToast({
                    description: `Package deleted successfully`,
                    variant: 'success',
                })
            );
            // Use functional update to prevent immediate re-render
            setRefresh(prev => !prev);
        }
    };

    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        bulkUpdateActiveStatus,
        handleDeleteCoupon,
        setRefresh,
    };
};

export default useGetSubscriptionCoupon;

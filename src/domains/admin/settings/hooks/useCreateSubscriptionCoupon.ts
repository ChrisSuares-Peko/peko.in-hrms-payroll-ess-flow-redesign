import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { addCouponCode, updateCouponCode } from '../api/pekoCredits';
import { Coupon, newCouponCode } from '../types/pekoCredits';

const useCreateSubscriptionCoupon = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createNewCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            const data: Coupon | false = await addCouponCode({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    const updateCurrenCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            const data: Coupon | false = await updateCouponCode({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return { isLoading, createNewCouponCode, updateCurrenCouponCode };
};

export default useCreateSubscriptionCoupon;

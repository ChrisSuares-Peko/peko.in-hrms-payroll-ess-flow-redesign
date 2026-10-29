import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { postApplyCoupon } from '../api';
import { ApplyCouponResponse, SelectedType } from '../types';
import { PLAN_DETAILS_SESSION_KEY } from '../utils';

interface State {
    selectedType: SelectedType;
}

export default function useApplyCoupon(planId: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isApplied, setIsApplied] = useState(false);
    const [coupon, setCoupon] = useState<string>('');
    const dispatch = useAppDispatch();

    const subscriptionData = sessionStorage.getItem(PLAN_DETAILS_SESSION_KEY);
    const { selectedType }: State = JSON.parse(subscriptionData as string);

    const applyCoupon = useCallback(
        async (couponCode: string, totalPrice: number) => {
            if (totalPrice <= 0) {
                dispatch(
                    showToast({
                        description:
                            'The total amount payable is ₹ 0. Since no further payment is required, additional discounts or coupons cannot be applied',
                        variant: 'error',
                    })
                );
                return;
            }

            setIsLoading(true);
            const data: ApplyCouponResponse | false = await postApplyCoupon({
                userId: id,
                userType: role,
                amount: totalPrice,
                couponCode,
                packageId: planId,
                billingType: selectedType,
            });
            if (data) {
                setDiscountAmount(data.discountAmount);
                setIsLoading(false);
                setIsApplied(true);
                setCoupon(couponCode);
            } else {
                setDiscountAmount(0);
                setIsLoading(false);
                setCoupon('');
            }
        },
        [id, role, planId, selectedType, dispatch]
    );

    const removeCoupon = useCallback(() => {
        setDiscountAmount(0);
        setIsApplied(false);
        setCoupon('');
    }, []);

    return { discountAmount, isLoading, applyCoupon, isApplied, removeCoupon, coupon };
}

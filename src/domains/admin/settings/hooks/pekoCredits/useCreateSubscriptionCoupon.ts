import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addCouponCode, updateCouponCode } from '../../api/pekoCredits';
import { Coupon, newCouponCode } from '../../types/pekoCredits';

type Props = {
    handleCancel: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const useCreateSubscriptionCoupon = ({ handleCancel, setRefresh }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const createNewCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            if (payload.couponType === 'SERVICES') {
                delete payload.packageId;
                delete payload.billingType;
            } else {
                delete payload.serviceOperatorId;
            }
            if (payload.discountType === 'FLAT') {
                delete payload.maximumDiscount;
            }
            const data: Coupon | false = await addCouponCode({
                userId: id,
                userType: role,
                ...payload,
                referralCodeId:
                    payload.referralCodeId === 'default' ? null : payload.referralCodeId,
                partnerId: payload.partnerId === 'default' ? null : payload.partnerId,
            });
            if (data) {
                handleCancel();
                setRefresh(prev => !prev); // Trigger refresh after success
                dispatch(
                    showToast({
                        description: `${payload.couponType === 'SUBSCRIPTION' ? 'Subscription' : 'Service'} coupon code created successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch, handleCancel, setRefresh]
    );

    const updateCurrenCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            if (payload.couponType === 'SERVICES') {
                delete payload.packageId;
                delete payload.billingType;
            } else {
                delete payload.serviceOperatorId;
            }
            if (payload.discountType === 'FLAT') {
                payload.maximumDiscount = null;
            }
            const data: Coupon | false = await updateCouponCode({
                userId: id,
                userType: role,
                ...payload,
                referralCodeId:
                    payload.referralCodeId === 'default' ? null : payload.referralCodeId,
                partnerId: payload.partnerId === 'default' ? null : payload.partnerId,
            });
            if (data) {
                handleCancel();
                setRefresh(prev => !prev); // Trigger refresh after success
                dispatch(
                    showToast({
                        description: `${payload.couponType === 'SUBSCRIPTION' ? 'Subscription' : 'Service'} coupon code updated successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch, handleCancel, setRefresh]
    );

    return { isLoading, createNewCouponCode, updateCurrenCouponCode };
};

export default useCreateSubscriptionCoupon;

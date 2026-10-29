import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addCouponCode, updateCouponCode } from '../api/couponCode';
import { Coupon, newCouponCode } from '../types/couponCode';

type Props = {
    handleCancel: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const UseCreateCouponCodes = ({ handleCancel, setRefresh }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
     const dispatch = useAppDispatch();

    const createNewCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            const data: Coupon | false = await addCouponCode({
                userId: id,
                userType: role,
                ...payload,
                 couponCode: payload.couponCode.toUpperCase(),
                partnerId: payload.partnerId === 'default' ? null : payload.partnerId,
                referralCodeId:
                    payload.referralCodeId === 'default' ? null : payload.referralCodeId,
                    packageId: payload.packageId || null,
            });
            if (data) {
                handleCancel();
                setRefresh(prev => !prev);
                dispatch(
                    showToast({ description: 'Coupon code added successfully', variant: 'success' })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch, handleCancel, setRefresh]
    );

    const updateCurrenCouponCode = useCallback(
        async (payload: newCouponCode) => {
            setIsLoading(true);
            const data: Coupon | false = await updateCouponCode({
                userId: id,
                userType: role,
                ...payload,
                couponCode: payload.couponCode.toUpperCase(),
                partnerId: payload.partnerId === 'default' ? null : payload.partnerId,
                referralCodeId:
                    payload.referralCodeId === 'default' ? null : payload.referralCodeId,
                    packageId: payload.packageId || null,
            });
            if (data) {
                handleCancel();
                setRefresh(prev => !prev);
                dispatch(
                    showToast({
                        description: 'Coupon code updated successfully',
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

export default UseCreateCouponCodes;

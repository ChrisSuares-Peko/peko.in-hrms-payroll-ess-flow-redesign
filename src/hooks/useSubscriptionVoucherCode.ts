import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ActivateCodeResponse, subscriptionCodeResponse } from '@customtypes/general';
import { SelectedType } from '@src/domains/dashboard/plans/types';
import { PLAN_DETAILS_SESSION_KEY } from '@src/domains/dashboard/plans/utils';
import { paths } from '@src/routes/paths';
import { checkCouponCode, activateCouponCode } from '@src/services/subscription';
import { showToast } from '@src/slices/apiSlice';

import { useAppDispatch, useAppSelector } from './store';
import useUserInfo from './useUserInfo';

interface State {
    selectedType: SelectedType;
}

export default function useSubscriptionCodes(planId: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isValidVoucher, setIsValidVoucher] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { getUserServicesData, getUserData } = useUserInfo();

    const subscriptionData = sessionStorage.getItem(PLAN_DETAILS_SESSION_KEY);
    const { selectedType }: State = JSON.parse(subscriptionData as string);

    const checkVoucherIsValid = async (activationCode: string) => {
        setIsLoading(true);
        const data: subscriptionCodeResponse | false = await checkCouponCode({
            userId: id,
            userType: role,
            activationCode,
            packageId: planId,
            selectedType,
        });
        if (data) {
            setVoucherCode(activationCode);
            setIsValidVoucher(true);
        }
        setIsLoading(false);
    };

    const activateSubscriptionCode = async () => {
        if (!isValidVoucher || !voucherCode) {
            dispatch(
                showToast({
                    description: 'Please enter a valid voucher code',
                    variant: 'error',
                })
            );
            return;
        }
        setIsActivating(true);

        const data: ActivateCodeResponse | false = await activateCouponCode({
            userId: id,
            userType: role,
            activationCode: voucherCode,
            packageId: planId,
            selectedType,
        });
        if (data) {
            await Promise.all([getUserServicesData(), getUserData()]);
            navigate(`/${paths.plans.index}/${paths.plans.paymentsuccess}`, {
                state: { packageName: data.subscription.packageName },
            });
        }
        setIsActivating(false);
    };
    return {
        isValidVoucher,
        setIsValidVoucher,
        isLoading,
        checkVoucherIsValid,
        activateSubscriptionCode,
        isActivating,
    };
}

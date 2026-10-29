import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updatePaymentMethodsApi } from '../../api/paymentMethods';
import { PaymentMethodsState } from '../../types/paymentMethods';

export default function useUpdatePaymentMethodsApi() {
    const [isLoading, setIsLoading] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const updatePaymentMethods = useCallback(
        async (settings: PaymentMethodsState) => {
            setIsLoading(true);
            const response = await updatePaymentMethodsApi({
                userId: id,
                userType: role,
                isCouponApplicable: settings.isCouponApplicable,
                isGatewayPaymentAvailable: settings.isGatewayPaymentAvailable,
                isWalletPaymentAvailable: settings.isWalletPaymentAvailable,
                isCorporateCardPaymentAvailable: settings.isCorporateCardPaymentAvailable ?? false,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: 'Global payment settings saved',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
            return Boolean(response);
        },
        [id, role, dispatch]
    );

    return { updatePaymentMethods, isLoading };
}

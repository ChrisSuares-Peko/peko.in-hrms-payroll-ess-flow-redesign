import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { resendPaymentLinkApi } from '../api/index';

export default function useSendMail() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const resendPaymentLink = useCallback(
        async (paymentLinkId: number) => {
            setIsLoading(true);
            const data: {} | false = await resendPaymentLinkApi({
                userId: id,
                userType: role,
                paymentLinkId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Payment link sent successfully.',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    return { sendMail: resendPaymentLink, loading: isLoading };
}

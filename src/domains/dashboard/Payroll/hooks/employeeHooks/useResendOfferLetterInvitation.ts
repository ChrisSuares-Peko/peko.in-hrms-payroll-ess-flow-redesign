import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { resendOfferLetterInvitation } from '../../api/employeeApi';

// Resends the AuthBridge signing reminder for an offer letter already sent for e-sign.
export const useResendOfferLetterInvitation = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isResending, setIsResending] = useState(false);

    const resendInvitation = async ({
        eSignId,
        email,
        name,
    }: {
        eSignId: string;
        email: string;
        name: string;
    }) => {
        setIsResending(true);
        const result = await resendOfferLetterInvitation({
            userId: id,
            userType: role,
            eSignId,
            email,
            name,
        });
        setIsResending(false);
        dispatch(
            showToast({
                description: result.success
                    ? 'Offer letter invitation resent successfully.'
                    : result.errorMessage || 'Failed to resend offer letter invitation.',
                variant: result.success ? 'success' : 'error',
            })
        );
        return result.success;
    };

    return { resendInvitation, isResending };
};

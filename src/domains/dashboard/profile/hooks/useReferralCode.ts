import { useState } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { SendReferralMail } from '../api/RefferalCode';

interface useBasicInfoApiProps {
    handleCancel?: () => void;
}
export default function useReferralCode({ handleCancel }: useBasicInfoApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useAppDispatch();

    const handleSendReferralMail = async (email: string) => {
        setIsLoading(true);
        const response: any | false = await SendReferralMail({
            userId: id,
            userType: role,
            email,
        });
        if (response) {
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({
                        description: 'The referral link has been sent successfully',
                        variant: 'success',
                    })
                );
            }
        }
        setIsLoading(false);
    };

    return {
        isLoading,
        handleSendReferralMail,
    };
}

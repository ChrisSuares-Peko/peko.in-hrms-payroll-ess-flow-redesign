import { useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { acceptPrivacyPolicy } from '../api';

export default function usePrivacyAcceptApi() {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const acceptPrivacyPolicyForUser = async (
        policyIds: Record<number, boolean>
    ): Promise<SuccessGenericResponse<{}> | false> => {
        try {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await acceptPrivacyPolicy(policyIds);

            if (response && !response.status) {
                dispatch(showToast({ description: response.message, variant: 'error' }));
            }
            setIsLoading(false);
            return response;
        } catch (err) {
            console.error('Privacy acceptance failed:', err);
            return false;
        }
    };

    return { acceptPrivacyPolicyForUser, isLoading };
}

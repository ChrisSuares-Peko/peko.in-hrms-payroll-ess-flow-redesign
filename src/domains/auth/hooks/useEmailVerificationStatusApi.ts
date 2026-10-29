import { useCallback } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';

import { verifyEmailStatus } from '../api/index';

export default function useVerifyEmailStatusApi() {
    const handleEmailVerificationStatus = useCallback(async (token: string | null) => {
        const payload = {
            token,
        };
        const response: SuccessGenericResponse<any> | false = await verifyEmailStatus(payload);
        return response;
    }, []);

    return { handleEmailVerificationStatus };
}

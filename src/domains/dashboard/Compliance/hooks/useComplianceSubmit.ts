import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { submitComplianceApi } from '../api';
import { ComplianceSubmitPayload } from '../types';

const useComplianceSubmit = () => {
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitCompliance = useCallback(
        async (payload: ComplianceSubmitPayload): Promise<{ complianceId: string; id: number } | false> => {
            setIsLoading(true);
            const result = await submitComplianceApi({ userId, userType, ...payload });
            setIsLoading(false);
            return result;
        },
        [userId, userType]
    );

    return { isLoading, submitCompliance };
};

export default useComplianceSubmit;

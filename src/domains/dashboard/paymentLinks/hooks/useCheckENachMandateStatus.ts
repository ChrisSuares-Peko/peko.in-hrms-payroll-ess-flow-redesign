import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getENachMandateStatus } from '../api';
import { ENachMandateStatusData } from '../types/paymentLinkTypes';

interface CheckStatusResult {
    success: boolean;
    data?: ENachMandateStatusData;
    message?: string;
}

const useCheckENachMandateStatus = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [checkingReferenceId, setCheckingReferenceId] = useState<string | null>(null);

    const checkStatus = useCallback(
        async (referenceId: string): Promise<CheckStatusResult> => {
            if (!referenceId) {
                return { success: false, message: 'Reference ID is required' };
            }

            setCheckingReferenceId(referenceId);
            const response = await getENachMandateStatus({
                userId: id,
                userType: role,
                reference_id: referenceId,
            });
            setCheckingReferenceId(null);

            if (!response) {
                return {
                    success: false,
                    message: 'Failed to fetch mandate status. Please try again.',
                };
            }

            return { success: true, data: response };
        },
        [id, role]
    );

    return { checkStatus, checkingReferenceId };
};

export default useCheckENachMandateStatus;

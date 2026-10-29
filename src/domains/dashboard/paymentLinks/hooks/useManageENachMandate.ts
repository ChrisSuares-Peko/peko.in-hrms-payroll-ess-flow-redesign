import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { manageENachMandate } from '../api';
import { ManageENachMandateData } from '../types/paymentLinkTypes';

interface ManageENachMandateResult {
    success: boolean;
    data?: ManageENachMandateData;
    message?: string;
}

export default function useManageENachMandate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [managingReferenceId, setManagingReferenceId] = useState<string | null>(null);

    const cancelMandate = useCallback(
        async (referenceId: string): Promise<ManageENachMandateResult> => {
            setManagingReferenceId(referenceId);
            try {
                const response = await manageENachMandate({
                    userId: id,
                    userType: role,
                    reference_id: referenceId,
                });

                return {
                    success: true,
                    data: response,
                };
            } catch (error: any) {
                return {
                    success: false,
                    message: error?.response?.data?.message || 'Failed to cancel mandate. Please try again.',
                };
            } finally {
                setManagingReferenceId(null);
            }
        },
        [id, role]
    );

    return {
        cancelMandate,
        managingReferenceId,
    };
}

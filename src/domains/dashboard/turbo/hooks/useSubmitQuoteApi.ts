import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createQuoteRequest } from '../api';

export default function useSubmitQuoteApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const submitQuoteApi = useCallback(
        async (payload: {
            fullName: string;
            mobileNumber: string;
            email: string;
            insuranceType: string;
            vehicleNumber?: string;
            vehicleId?: number;
        }) => {
            setLoading(true);
            try {
                const data: any = await createQuoteRequest({
                    userId: id,
                    userType: role,
                    ...payload,
                });
                return data || false;
            } catch (error) {
                console.error('Error submitting quote request:', error);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [id, role]
    );

    return { submitQuoteApi, loading };
}

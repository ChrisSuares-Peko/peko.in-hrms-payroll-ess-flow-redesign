import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFormTableById } from '../api/globalBusinessSetup';

export function useFormTableById() {
    const { role: userType, id: userId } = useAppSelector(state => state.reducer.auth);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFormTableById = useCallback(
        async (tableId: string) => {
            if (!tableId) {
                console.warn('⚠️ fetchFormTableById called without tableId');
                return null;
            }

            try {
                setLoading(true);
                setError(null);

                const res = await getFormTableById({
                    tableId,
                    userId,
                    userType,
                });

                if (!res) {
                    throw new Error('Failed to fetch form table');
                }

                setData(res);
                return res;
            } catch (err: any) {
                console.error('🔥 Failed to fetch form table:', err);
                setError(err?.message || 'Something went wrong');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [userId, userType]
    );

    return {
        data,
        loading,
        error,
        fetchFormTableById,
    };
}

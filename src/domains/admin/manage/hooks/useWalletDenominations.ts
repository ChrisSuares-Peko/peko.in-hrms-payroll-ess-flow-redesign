import { useEffect, useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getWalletDenomination, updateWalletDenomination } from '../api/wallet';
import { Denominations } from '../types/types';

export default function useWalletDenominations() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [denomination, setDenominations] = useState<Denominations>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const fetchWalletDenominations = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = (await getWalletDenomination({
                userId: id,
                userType: role,
            })) as Denominations | false;

            if (data) setDenominations(data);
        } catch (error) {
            console.error('Failed to fetch wallet denominations:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    const updateWalletDenominations = useCallback(
        async (denominations: Denominations) => {
            try {
                await updateWalletDenomination({
                    userType: role,
                    userId: id,
                    denominations,
                });
                await fetchWalletDenominations();
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Peko wallet updated successfully',
                    })
                );
            } catch (error) {
                console.error('Failed to update wallet denominations:', error);
                throw error;
            }
        },
        [role, id, fetchWalletDenominations, dispatch]
    );

    useEffect(() => {
        fetchWalletDenominations();
    }, [fetchWalletDenominations]);

    return { denomination, isLoading, updateWalletDenominations };
}

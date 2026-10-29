import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getDomainTlds, updateDomainTlds } from '../api/domainTlds';

export default function useDomainTlds() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tlds, setTlds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const fetchDomainTlds = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getDomainTlds({ userId: id, userType: role });
            if (data) setTlds(data as string[]);
        } catch (error) {
            console.error('Failed to fetch domain TLDs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    const saveDomainTlds = useCallback(
        async (newTlds: string[]) => {
            try {
                await updateDomainTlds({ userType: role, userId: id, tlds: newTlds });
                await fetchDomainTlds();
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Domain TLDs updated successfully',
                    })
                );
            } catch (error) {
                console.error('Failed to update domain TLDs:', error);
                throw error;
            }
        },
        [role, id, fetchDomainTlds, dispatch]
    );

    useEffect(() => {
        fetchDomainTlds();
    }, [fetchDomainTlds]);

    return { tlds, isLoading, saveDomainTlds };
}

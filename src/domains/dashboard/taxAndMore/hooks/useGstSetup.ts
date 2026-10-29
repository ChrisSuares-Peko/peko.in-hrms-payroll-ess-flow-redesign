import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createGstSetup, getGstSetups } from '../api/tax';
import { setActiveSetup } from '../slice/taxMoreSlice';
import { GstSetup, GstSetupPayload } from '../types';

const useGstSetup = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [setups, setSetups] = useState<GstSetup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchSetups = useCallback(async () => {
        setIsLoading(true);
        const data = await getGstSetups({ userId: id, userType: role });
        if (data) {
            setSetups(data);
            if (data.length > 0) dispatch(setActiveSetup(data[0]));
        }
        setIsLoading(false);
    }, [id, role, dispatch]);

    const create = useCallback(
        async (payload: GstSetupPayload) => {
            setIsCreating(true);
            const resp = await createGstSetup({ userId: id, userType: role, ...payload });
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description:
                            'KYC verification completed successfully. GST filing is now enabled.',
                        variant: 'success',
                    })
                );
                await fetchSetups();
                setIsCreating(false);
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsCreating(false);
            return false;
        },
        [id, role, dispatch, fetchSetups]
    );

    useEffect(() => {
        fetchSetups();
    }, [fetchSetups]);

    return { setups, isLoading, isCreating, create, refresh: fetchSetups };
};

export default useGstSetup;

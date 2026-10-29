import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getLandingConfig } from '../api';
import { setLandingConfig, setLoading, setError } from '../slices/incorporationSlice';
import { LandingConfigResponse } from '../types';

export const useLandingConfig = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { landingConfig, isLoading } = useAppSelector(state => state.reducer.incorporation);

    const fetchConfig = useCallback(async () => {
        if (!userId || !userType) return;

        dispatch(setLoading(true));
        const response = await getLandingConfig({ userId, userType });

        if (response) {
            dispatch(setLandingConfig(response as LandingConfigResponse));
            dispatch(setError(null));
        } else {
            dispatch(setError('Failed to load landing configuration'));
        }
        dispatch(setLoading(false));
    }, [userId, userType, dispatch]);

    useEffect(() => {
        if (!landingConfig) {
            fetchConfig();
        }
    }, [landingConfig, fetchConfig]);

    return { landingConfig, isLoading, refetch: fetchConfig };
};

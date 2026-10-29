import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getApplications, getApplicationDetail } from '../api';
import {
    setApplications,
    setCurrentApplicationDetail,
    setLoading,
    setError,
} from '../slices/incorporationSlice';
import { Application, ApplicationsListResponse } from '../types';

export const useApplicationTracking = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { applications, currentApplicationDetail, isLoading, submittedApplication } =
        useAppSelector(state => state.reducer.incorporation);

    const fetchApplications = useCallback(async () => {
        if (!userId || !userType) return;
        dispatch(setLoading(true));

        // Fast path: applicationId already in Redux from payment flow
        const knownId = submittedApplication?.applicationId;
        if (knownId) {
            const detail = await getApplicationDetail({ userId, userType, applicationId: knownId });
            if (detail) {
                dispatch(setCurrentApplicationDetail(detail as Application));
                dispatch(setError(null));
            } else {
                dispatch(setError('Failed to load application details'));
            }
            dispatch(setLoading(false));
            return;
        }

        // Fallback: page refresh or direct navigation — applicationId not in Redux
        const listResponse = await getApplications({ userId, userType });
        if (listResponse) {
            const apps = (listResponse as ApplicationsListResponse).applications || [];
            dispatch(setApplications(apps));
            dispatch(setError(null));
            if (apps.length > 0) {
                const detail = await getApplicationDetail({
                    userId,
                    userType,
                    applicationId: apps[0].applicationId,
                });
                if (detail) dispatch(setCurrentApplicationDetail(detail as Application));
            }
        } else {
            dispatch(setError('Failed to load applications'));
        }
        dispatch(setLoading(false));
    }, [userId, userType, submittedApplication, dispatch]);

    const fetchApplicationDetail = useCallback(
        async (applicationId: string) => {
            if (!userId || !userType) return;
            dispatch(setLoading(true));
            const response = await getApplicationDetail({ userId, userType, applicationId });
            if (response) {
                dispatch(setCurrentApplicationDetail(response as Application));
                dispatch(setError(null));
            } else {
                dispatch(setError('Failed to load application details'));
            }
            dispatch(setLoading(false));
        },
        [userId, userType, dispatch]
    );

    return {
        applications,
        currentApplicationDetail,
        isLoading,
        fetchApplications,
        fetchApplicationDetail,
    };
};

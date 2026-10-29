import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getApplications } from '../api';
import { setApplications } from '../slices/incorporationSlice';
import { Application } from '../types';

export const useExistingApplication = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const applications = useAppSelector(state => state.reducer.incorporation.applications);

    const fetchApplications = useCallback(async () => {
        if (!userId || !userType) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const response = await getApplications({ userId: Number(userId), userType });
        if (response) {
            dispatch(setApplications(response.applications || []));
        }
        setIsLoading(false);
    }, [userId, userType, dispatch]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const existingApplication: Application | null =
        applications.length > 0
            ? [...applications].sort(
                  (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0]
            : null;

    return { existingApplication, isLoading };
};

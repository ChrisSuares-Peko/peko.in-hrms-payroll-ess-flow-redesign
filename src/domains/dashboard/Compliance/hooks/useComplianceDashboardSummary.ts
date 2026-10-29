import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceDashboardSummaryApi } from '../api';
import { ComplianceDashboardSummary } from '../types';

export const useComplianceDashboardSummary = () => {
    const { id: userId, role: userType } = useAppSelector((state) => state.reducer.auth);
    const [summary, setSummary] = useState<ComplianceDashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        const response = await getComplianceDashboardSummaryApi({ userId: Number(userId), userType });
        if (response) {
            setSummary(response);
        } else {
            setIsError(true);
        }
        setIsLoading(false);
    }, [userId, userType]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return { summary, isLoading, isError };
};

import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNewHireProfile } from '../../api/employeeApi';

export function useGetNewHireProfile(employeeId?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        if (!employeeId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const result = await getNewHireProfile({ userId: id, userType: role, employeeId });
        if (result) setData(result);
        setIsLoading(false);
    }, [employeeId, id, role]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { data, isLoading, refetch: fetchProfile };
}

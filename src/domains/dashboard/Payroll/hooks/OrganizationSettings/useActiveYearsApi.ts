import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPayrollActiveYears } from '../../api/organizationSettings';

export default function useActiveYearsApi() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const [years, setPayrollYears] = useState<any>();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const getPayrollYears = useCallback(async () => {
        setIsLoading(true);
        const res = await getPayrollActiveYears({ userId: id, userType: role });
        if (res?.status === false) {
            setPayrollYears(undefined);
            setErrorMessage(res.errorMessage);
        } else if (res) {
            setPayrollYears(res);
            setErrorMessage(undefined);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getPayrollYears();
    }, [getPayrollYears]);

    return {
        years,
        isLoading,
        errorMessage,
    };
}

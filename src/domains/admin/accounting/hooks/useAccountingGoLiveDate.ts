import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingGoLiveDate, updateAccountingGoLiveDate } from '../api/accountingPeriod';
import { AccountingGoLiveDate } from '../types/accountingPeriod';

export default function useAccountingGoLiveDate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [goLive, setGoLive] = useState<AccountingGoLiveDate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getAccountingGoLiveDate({ userId: id, userType: role });
        if (result) setGoLive(result);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load]);

    const save = useCallback(
        async (date: string, reason: string) => {
            setIsSaving(true);
            const result = await updateAccountingGoLiveDate({
                userId: id,
                userType: role,
                date,
                reason,
            });
            setIsSaving(false);
            if (result) setGoLive(result);
            return Boolean(result);
        },
        [id, role]
    );

    return { goLive, isLoading, isSaving, save, refetch: load };
}

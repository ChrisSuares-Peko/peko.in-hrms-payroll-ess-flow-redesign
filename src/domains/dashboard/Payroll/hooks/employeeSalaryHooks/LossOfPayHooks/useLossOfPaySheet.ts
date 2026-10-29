import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getLossOfPaySheet, saveLossOfPaySheet } from '../../../api/employeeSalaryApi/lossOfPayApi';
import { LossOfPayEntry, LossOfPaySheet } from '../../../types/salaryProfileTypes/lossOfPayTypes';

export function useLossOfPaySheet(month: number, year: number, enabled = true) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [sheet, setSheet] = useState<LossOfPaySheet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!enabled) return undefined;
        let cancelled = false;
        setIsLoading(true);
        getLossOfPaySheet({ userType: role, userId: id, month, year }).then(res => {
            if (cancelled) return;
            setSheet(res && res.data ? res.data : null);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [role, id, month, year, enabled]);

    const save = useCallback(
        async (entries: LossOfPayEntry[]) => {
            setIsSaving(true);
            const res = await saveLossOfPaySheet({ userType: role, userId: id, month, year, entries });
            setIsSaving(false);
            if (res && res.data) {
                setSheet(res.data);
                dispatch(showToast({ description: res.message, variant: 'success' }));
                return true;
            }
            return false;
        },
        [role, id, month, year, dispatch]
    );

    return { sheet, isLoading, isSaving, save };
}

import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getApprovalGate, updateApprovalGate } from '../api/approvals';
import { ApprovalGate } from '../types/approvals';

export default function useApprovalGateState() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [gate, setGate] = useState<ApprovalGate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getApprovalGate({ userId: id, userType: role });
        if (result) setGate(result);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load]);

    const setEnabled = useCallback(
        async (enabled: boolean) => {
            setIsSaving(true);
            const result = await updateApprovalGate({ userId: id, userType: role, enabled });
            setIsSaving(false);
            if (!result) return false;
            setGate(result);
            dispatch(
                showToast({
                    description: enabled
                        ? 'Approval gate turned on'
                        : 'Approval gate turned off — dev mode',
                    variant: 'success',
                })
            );
            return true;
        },
        [dispatch, id, role]
    );

    return { gate, isLoading, isSaving, setEnabled, refetch: load };
}

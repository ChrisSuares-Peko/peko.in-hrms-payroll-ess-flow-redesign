import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getKycStatus } from '../../api/user/kycApi';
import { setKycInfo, setKycStage } from '../../slices/corporateCardsSlice';
import { KycStage } from '../../utils/types';

const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso)
        .toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        .replace(/am|pm/i, match => match.toUpperCase());
};

/** Identity the resolved status belongs to. A status answered for another session tells us nothing. */
const statusKey = (role?: string | null, id?: number | string | null) =>
    `${role ?? ''}:${id ?? ''}`;

export const useKycStatusApi = (enabled: boolean) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // `useState(enabled)` alone was only right on the first render. On a user or mode switch `enabled`,
    // `role` or `id` change and this hook re-renders BEFORE its effect re-runs, so it reported
    // isLoading=false while kycStage still held the default 'initiate' — one frame of the Complete-KYC
    // screen. Comparing against the identity we last settled for makes the stale window impossible,
    // because the answer is invalidated in the same render that changes the question.
    const [settledKey, setSettledKey] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const fetchStatus = async () => {
            setIsFetching(true);
            const res = await getKycStatus(role, id);
            if (res && res.data?.kyc) {
                const { state, refId, submittedOn } = res.data.kyc;
                let stage: KycStage = 'initiate';
                if (state === 'COMPLETED') stage = 'verified';
                else if (state === 'IN_REVIEW') stage = 'submitted';
                dispatch(setKycStage(stage));
                dispatch(
                    setKycInfo({
                        refId: refId ?? null,
                        submittedOn: formatDate(submittedOn ?? null),
                    })
                );
            }
            // Settled even when the call failed: the gate then falls through to its default rather than
            // trapping the user behind a loader that will never clear.
            setSettledKey(statusKey(role, id));
            setIsFetching(false);
        };

        fetchStatus();
    }, [enabled, role, id, dispatch]);

    const isLoading = enabled && (isFetching || settledKey !== statusKey(role, id));

    return { isLoading };
};

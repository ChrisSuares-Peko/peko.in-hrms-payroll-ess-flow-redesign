import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getKybStatus, KybApiStatus, KybApplicationApiShape } from '../../api/admin/kybStatusApi';
import { setBusinessType, setKybInfo, setKybStage } from '../../slices/corporateCardsSlice';
import { KybStage } from '../../utils/types';

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

const STAGE_BY_STATUS: Record<Exclude<KybApiStatus, 'PENDING'>, KybStage> = {
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    COMPLETED: 'complete',
};

export const resolveStage = (application: KybApplicationApiShape | null): KybStage => {
    if (!application) return 'landing';
    if (application.kybStatus === 'PENDING') {
        if (application.kybReference) return 'submitted';
        return application.businessType ? 'upload' : 'landing';
    }
    // A rejection the corporate has already acted on puts them back into the flow they were fixing, not
    // onto the screen they dismissed. Without this a reload strands a half-finished resubmission on the
    // rejection screen, and clicking through it again is the only way back.
    if (application.kybStatus === 'REJECTED' && application.rejectionAcknowledged) {
        return application.businessType ? 'upload' : 'initiate';
    }
    // A reviewer can mark COMPLETED without ever setting VERIFIED. The corporate is still owed the
    // verified screen once, so the acknowledgement decides this rather than the status alone.
    if (application.kybStatus === 'COMPLETED' && !application.verifiedAcknowledged) {
        return 'verified';
    }
    return STAGE_BY_STATUS[application.kybStatus] ?? 'landing';
};

/** Identity the resolved status belongs to. A status answered for another session tells us nothing. */
const statusKey = (role?: string | null, id?: number | string | null) =>
    `${role ?? ''}:${id ?? ''}`;

/** Fetches the corporate's own KYB status on mount and syncs the redux gate (kybStage + kybInfo). */
export const useKybStatusApi = (enabled: boolean) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // `useState(enabled)` alone was only right on the first render. On a user or mode switch `enabled`,
    // `role` or `id` change and this hook re-renders BEFORE its effect re-runs, so it reported
    // isLoading=false while kybStage still held the default 'initiate' — one frame of the Complete-KYB
    // screen. Comparing against the identity we last settled for makes the stale window impossible,
    // because the answer is invalidated in the same render that changes the question.
    const [settledKey, setSettledKey] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    // Guards against re-firing kyb_verification_status on every poll/refetch that still lands on
    // the same terminal status (e.g. a screen re-fetching while already VERIFIED/REJECTED).
    const lastTrackedStatus = useRef<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!enabled) return;
        setIsFetching(true);
        const res = await getKybStatus(role, id);
        if (res) {
            const application = res.data?.application ?? null;
            dispatch(setKybStage(resolveStage(application)));
            dispatch(setBusinessType(application?.businessType ?? null));
            dispatch(
                setKybInfo({
                    refId: application?.kybReference ?? null,
                    submittedOn: formatDate(application?.updatedAt ?? null),
                    rejectionReason: application?.rejectionReason ?? null,
                    kybStatus: application?.kybStatus ?? null,
                })
            );
            const kybStatus = application?.kybStatus ?? null;
            const isTerminal = kybStatus === 'VERIFIED' || kybStatus === 'COMPLETED' || kybStatus === 'REJECTED';
            if (
                isTerminal &&
                kybStatus !== lastTrackedStatus.current &&
                typeof Moengage?.track_event === 'function'
            ) {
                Moengage.track_event('kyb_verification_status', {
                    status: kybStatus === 'REJECTED' ? 'failed' : 'successful',
                });
            }
            if (kybStatus) lastTrackedStatus.current = kybStatus;
        }
        // Settled even when the call failed: the gate then falls through to its default rather than
        // trapping the user behind a loader that will never clear.
        setSettledKey(statusKey(role, id));
        setIsFetching(false);
    }, [enabled, role, id, dispatch]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const isLoading = enabled && (isFetching || settledKey !== statusKey(role, id));

    return { isLoading, refetch: fetchStatus };
};

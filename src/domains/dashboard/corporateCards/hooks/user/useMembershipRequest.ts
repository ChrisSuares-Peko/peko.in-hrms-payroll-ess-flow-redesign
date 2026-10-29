import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createMembershipRequest,
    getMembershipRequest,
    MembershipRequest,
} from '../../api/user/membershipApi';

export type MembershipStage = 'request' | 'submitted' | 'pending' | 'approved' | 'rejected';

/**
 * Which screen a non-member sees.
 *
 * `submitted` is deliberately not a server status — it is the moment the POST resolves. A reload re-reads
 * the server, which reports PENDING, so the submitted confirmation shows once and the pending screen
 * thereafter. A CANCELLED request behaves like no request at all: the employee may ask again.
 */
export const stageFor = (
    request: MembershipRequest | null,
    justSubmitted: boolean
): MembershipStage => {
    if (justSubmitted) return 'submitted';
    if (!request || request.status === 'CANCELLED') return 'request';
    if (request.status === 'APPROVED') return 'approved';
    if (request.status === 'REJECTED') return 'rejected';
    return 'pending';
};

export const useMembershipRequest = (enabled: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [request, setRequest] = useState<MembershipRequest | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);

    const fetchRequest = useCallback(async () => {
        const data = await getMembershipRequest(role, id);
        if (data) setRequest(data.request);
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        fetchRequest();
    }, [enabled, fetchRequest]);

    const submitRequest = useCallback(async () => {
        setIsSubmitting(true);
        const data = await createMembershipRequest(role, id);
        setIsSubmitting(false);
        if (!data) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not send your request. Please try again.',
                })
            );
            return;
        }
        setRequest(data.request);
        setJustSubmitted(true);
    }, [role, id, dispatch]);

    return {
        request,
        stage: stageFor(request, justSubmitted),
        isLoading,
        isSubmitting,
        submitRequest,
        refetch: fetchRequest,
    };
};

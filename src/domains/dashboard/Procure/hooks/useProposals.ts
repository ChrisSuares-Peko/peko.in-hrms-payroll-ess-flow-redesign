import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { acceptProposal, createProposal, declineProposal, getAllProposals, getProposalById, getProposals, getRFQsAll, undoAcceptProposal, undoDeclineProposal } from '../api';

interface UseProposalsProps {
    id?: string | number;
    rfqId?: string | number;
    filters?: Record<string, any>;
}

export function useProposals({ id, rfqId, filters }: UseProposalsProps = {}) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading]       = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proposals, setProposals]               = useState<any[]>([]);
    const [rfqLineItems, setRfqLineItems]         = useState<any[]>([]);
    const [purchaseRequestStatus, setPurchaseRequestStatus] = useState<string | null>(null);
    const [allProposals, setAllProposals] = useState<any[]>([]);
    const [allCount, setAllCount]         = useState(0);
    const [detail, setDetail]             = useState<any | null>(null);
    const [rfqListDropdown, setRfqListDropdown] = useState<any[]>([]);

    const fetchRfqListDropdown = useCallback(async () => {
        const data = await getRFQsAll({ corporateId: String(corporateId) });
        if (data) setRfqListDropdown(data);
    }, [corporateId]);

    const fetchAllProposals = useCallback(async () => {
        if (!filters) return;
        setIsLoading(true);
        const data = await getAllProposals({ corporateId: String(corporateId), ...filters });
        if (data) {
            setAllProposals(data.rows ?? []);
            setAllCount(data.count ?? 0);
        }
        setIsLoading(false);
    }, [corporateId, filters]);

    useEffect(() => {
        fetchAllProposals();
    }, [fetchAllProposals]);

    const fetchProposals = useCallback(async () => {
        if (!rfqId) return;
        setIsLoading(true);
        const data = await getProposals({ corporateId: String(corporateId), rfqId });
        if (data) {
            setProposals(data.proposals ?? []);
            setRfqLineItems(data.rfqLineItems ?? []);
            setPurchaseRequestStatus(data.purchaseRequestStatus ?? null);
        }
        setIsLoading(false);
    }, [corporateId, rfqId]);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getProposalById({ corporateId: String(corporateId), id, ...(rfqId ? { rfqId } : {}) });
        if (data) {
            setDetail(data.proposal ?? data);
            if (data.rfqLineItems) setRfqLineItems(data.rfqLineItems);
        }
        setIsLoading(false);
    }, [corporateId, id, rfqId]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const create = useCallback(async (payload: any): Promise<any | false> => {
        setIsSubmitting(true);
        const result = await createProposal({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const accept = useCallback(async (proposalId: string | number, proposalRfqId: string | number): Promise<any | false> => {
        setIsSubmitting(true);
        const result = await acceptProposal({ corporateId: String(corporateId), id: proposalId, rfqId: proposalRfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: 'Proposal accepted. You can now create a Purchase Order.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const decline = useCallback(async (proposalId: string | number, proposalRfqId: string | number): Promise<any | false> => {
        setIsSubmitting(true);
        const result = await declineProposal({ corporateId: String(corporateId), id: proposalId, rfqId: proposalRfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: 'Proposal Rejected.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const undoDecline = useCallback(async (proposalId: string | number, proposalRfqId: string | number): Promise<any | false> => {
        setIsSubmitting(true);
        const result = await undoDeclineProposal({ corporateId: String(corporateId), id: proposalId, rfqId: proposalRfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    const undoAccept = useCallback(async (proposalId: string | number, proposalRfqId: string | number): Promise<any | false> => {
        setIsSubmitting(true);
        const result = await undoAcceptProposal({ corporateId: String(corporateId), id: proposalId, rfqId: proposalRfqId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message ?? 'Proposal acceptance undone.' }));
        }
        setIsSubmitting(false);
        return result ? result.data : false;
    }, [corporateId, dispatch]);

    return { isLoading, isSubmitting, proposals, rfqLineItems, purchaseRequestStatus, allProposals, allCount, detail, rfqListDropdown, fetchRfqListDropdown, fetchProposals, fetchAllProposals, fetchDetail, create, accept, decline, undoAccept, undoDecline };
}

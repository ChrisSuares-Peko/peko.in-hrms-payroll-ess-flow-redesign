import { useEffect, useState } from 'react';

import { getPublicRFQInvite, submitPublicProposal } from '../api';
import type { PublicRFQInviteData, SubmitProposalPayload } from '../types';

export type { PublicRFQInviteData, PublicRFQLineItem, SubmitProposalPayload } from '../types';

interface UsePublicProposalReturn {
    data: PublicRFQInviteData | null;
    isLoading: boolean;
    isInvalid: boolean;
    isExpired: boolean;
    isSubmitting: boolean;
    isSubmitted: boolean;
    submitProposal: (payload: SubmitProposalPayload) => Promise<boolean>;
}

export const usePublicProposal = (token: string | undefined): UsePublicProposalReturn => {
    const [data, setData] = useState<PublicRFQInviteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInvalid, setIsInvalid] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsInvalid(true);
            setIsLoading(false);
            return;
        }

        const fetchRFQ = async () => {
            setIsLoading(true);
            const result = await getPublicRFQInvite(token);
            if (!result) {
                setIsInvalid(true);
            } else if (result.invite?.expiresAt && new Date(result.invite.expiresAt) < new Date()) {
                setIsExpired(true);
            } else {
                setData(result);
            }
            setIsLoading(false);
        };

        fetchRFQ();
    }, [token]);

    const submitProposal = async (payload: SubmitProposalPayload): Promise<boolean> => {
        if (!token) return false;
        setIsSubmitting(true);
        const success = await submitPublicProposal(token, payload);
        if (success) setIsSubmitted(true);
        setIsSubmitting(false);
        return success;
    };

    return { data, isLoading, isInvalid, isExpired, isSubmitting, isSubmitted, submitProposal };
};

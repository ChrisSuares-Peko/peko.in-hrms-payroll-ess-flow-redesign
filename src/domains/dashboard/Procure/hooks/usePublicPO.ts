import { useEffect, useState } from 'react';

import { acknowledgePublicPO, downloadPublicPOPdf, getPublicPOInvite } from '../api';
import type { AcknowledgePOPayload, PublicPOInviteData } from '../types';

export type { AcknowledgePOPayload, PublicPOInviteData } from '../types';

interface UsePublicPOReturn {
    data: PublicPOInviteData | null;
    isLoading: boolean;
    isInvalid: boolean;
    isExpired: boolean;
    isAcknowledged: boolean;
    isSubmitting: boolean;
    isSubmitted: boolean;
    isDownloadingPdf: boolean;
    acknowledgePO: (payload: AcknowledgePOPayload) => Promise<boolean>;
    downloadPdf: () => Promise<void>;
}

export const usePublicPO = (token: string | undefined): UsePublicPOReturn => {
    const [data, setData] = useState<PublicPOInviteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInvalid, setIsInvalid] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsInvalid(true);
            setIsLoading(false);
            return;
        }

        const fetchPO = async () => {
            setIsLoading(true);
            const result = await getPublicPOInvite(token);
            if (!result) {
                setIsInvalid(true);
            } else if (result.invite?.expiresAt && new Date(result.invite.expiresAt) < new Date()) {
                setIsExpired(true);
            } else if (result.invite?.status === 'acknowledged') {
                setData(result);
                setIsAcknowledged(true);
            } else {
                setData(result);
            }
            setIsLoading(false);
        };

        fetchPO();
    }, [token]);

    const acknowledgePO = async (payload: AcknowledgePOPayload): Promise<boolean> => {
        if (!token) return false;
        setIsSubmitting(true);
        const success = await acknowledgePublicPO(token, payload);
        if (success) setIsSubmitted(true);
        setIsSubmitting(false);
        return success;
    };

    const downloadPdf = async (): Promise<void> => {
        if (!token || !data) return;
        setIsDownloadingPdf(true);
        const blob = await downloadPublicPOPdf(token);
        setIsDownloadingPdf(false);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.po.refNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    return { data, isLoading, isInvalid, isExpired, isAcknowledged, isSubmitting, isSubmitted, isDownloadingPdf, acknowledgePO, downloadPdf };
};

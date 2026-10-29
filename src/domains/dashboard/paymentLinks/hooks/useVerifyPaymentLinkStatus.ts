import { useEffect, useMemo, useState } from 'react';

import axios from 'axios';

import { SERVER_URL } from '@src/config-global';

export type PaymentStatus = 'success' | 'error' | 'pending';

const normalizeStatus = (raw: string): PaymentStatus => {
    const status = raw.toLowerCase();
    if (status === 'success') return 'success';
    if (['failed', 'failure', 'error', 'cancelled'].includes(status)) return 'error';
    return 'pending';
};

const parseStatusFromQuery = (queryStatus: string | null): PaymentStatus =>
    normalizeStatus(queryStatus || 'pending');

const useVerifyPaymentLinkStatus = ({
    referenceId,
    queryStatus,
}: {
    referenceId: string | null;
    queryStatus: string | null;
}) => {
    const [verifiedStatus, setVerifiedStatus] = useState<PaymentStatus | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (!referenceId) return;

        const verify = async () => {
            setIsVerifying(true);
            try {
                const resp = await axios.post(
                    `${SERVER_URL}/webhook/decentro/payment/payment-links/verify-payment`,
                    { reference_id: referenceId }
                );
                setVerifiedStatus(normalizeStatus(resp.data?.data?.status ?? ''));
            } catch (err: any) {
                const rawStatus = err?.response?.data?.data?.status ?? 'error';
                setVerifiedStatus(normalizeStatus(rawStatus));
            } finally {
                setIsVerifying(false);
            }
        };

        verify();
    }, [referenceId]);

    const paymentStatus = useMemo<PaymentStatus>(() => {
        if (verifiedStatus) return verifiedStatus;
        return parseStatusFromQuery(queryStatus);
    }, [queryStatus, verifiedStatus]);

    return {
        paymentStatus,
        isVerifying,
    };
};

export default useVerifyPaymentLinkStatus;

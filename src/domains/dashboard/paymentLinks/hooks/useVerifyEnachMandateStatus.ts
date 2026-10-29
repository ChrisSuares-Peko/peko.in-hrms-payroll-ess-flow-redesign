import { useEffect, useMemo, useState } from 'react';

import axios from 'axios';

import { SERVER_URL } from '@src/config-global';

export type MandateStatus = 'success' | 'error' | 'pending';

const normalizeStatus = (raw: string): MandateStatus => {
    const status = String(raw || '').toUpperCase();

    if (['SUCCESS', 'ACTIVE', 'REGISTERED', 'APPROVED', 'COMPLETED'].includes(status)) {
        return 'success';
    }

    if (
        [
            'FAILED',
            'FAILURE',
            'ERROR',
            'REJECTED',
            'CANCELLED',
            'CANCELED',
            'EXPIRED',
            'INACTIVE',
            'SESSION_TIMEOUT',
            'SESSION_CANCELLED',
        ].includes(status)
    ) {
        return 'error';
    }

    return 'pending';
};

const parseStatusFromQuery = (queryStatus: string | null): MandateStatus =>
    normalizeStatus(queryStatus || 'pending');

const useVerifyEnachMandateStatus = ({
    referenceId,
    queryStatus,
    decentroTxnId,
    decentroMandateId,
}: {
    referenceId: string | null;
    queryStatus: string | null;
    decentroTxnId?: string | null;
    decentroMandateId?: string | null;
}) => {
    const [verifiedStatus, setVerifiedStatus] = useState<MandateStatus | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (!referenceId) return;

        const verify = async () => {
            setIsVerifying(true);
            try {
                const resp = await axios.get(
                    `${SERVER_URL}/webhook/decentro/payment/enach-mandate/verify-payment`,
                    {
                        params: {
                            reference_id: referenceId,
                            ...(decentroTxnId ? { decentro_txn_id: decentroTxnId } : {}),
                            ...(decentroMandateId ? { decentro_mandate_id: decentroMandateId } : {}),
                        },
                    }
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
    }, [referenceId, decentroTxnId, decentroMandateId]);

    const mandateStatus = useMemo<MandateStatus>(() => {
        if (verifiedStatus) return verifiedStatus;
        return parseStatusFromQuery(queryStatus);
    }, [queryStatus, verifiedStatus]);

    return {
        mandateStatus,
        isVerifying,
    };
};

export default useVerifyEnachMandateStatus;

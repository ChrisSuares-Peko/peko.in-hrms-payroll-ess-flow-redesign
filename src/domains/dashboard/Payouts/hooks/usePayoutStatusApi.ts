import { useRef } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchPayoutStatus } from '../api';
import { PayoutTransferResponse } from '../types';

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 4;

export default function usePayoutStatusApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);

    const stopPolling = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        attemptsRef.current = 0;
    };

    const startPolling = (
        transactionId: number,
        onResolved: (result: PayoutTransferResponse) => void
    ) => {
        stopPolling();

        const poll = async () => {
            if (attemptsRef.current >= MAX_ATTEMPTS) {
                stopPolling();
                return;
            }

            attemptsRef.current += 1;
            const res = await fetchPayoutStatus(role, id, transactionId);

            if (res && res.transactionStatus?.toLowerCase() !== 'pending') {
                stopPolling();
                onResolved(res);
                return;
            }

            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        };

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    return { startPolling, stopPolling };
}

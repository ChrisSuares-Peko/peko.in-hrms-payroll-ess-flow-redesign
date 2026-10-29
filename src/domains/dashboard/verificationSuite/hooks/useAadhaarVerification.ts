import { useCallback, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { generateAadhaarLink, getAadhaarDetails } from '../api';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const MAX_CONSECUTIVE_ERRORS = 3;

type AadhaarLinkValues = {
    name?: string;
    email?: string;
    mobile?: string;
};

type PollCallbacks = {
    onSuccess: (data: any) => void;
    onFailed: () => void;
    onTimeout: () => void;
};

export default function useAadhaarVerification() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollDeadlineRef = useRef<number>(0);
    const consecutiveErrorsRef = useRef<number>(0);

    const generateLink = useCallback(
        async (values: AadhaarLinkValues) => {
            setIsGeneratingLink(true);
            try {
                const resp = await generateAadhaarLink({ userId: id, userType: role, values });
                if (!resp || !resp.status) return false;
                const { data } = resp;
                return {
                    link: data?.link,
                    reference_number: data?.referenceNumber,
                    transaction_id: data?.transactionId,
                };
            } catch (error) {
                return false;
            } finally {
                setIsGeneratingLink(false);
            }
        },
        [id, role]
    );

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        setIsPolling(false);
    }, []);

    const checkStatus = useCallback(
        async (referenceNumber: string, transactionId: string) => {
            const resp = await getAadhaarDetails({
                userId: id,
                userType: role,
                reference_number: referenceNumber,
                transaction_id: transactionId,
            });
            return resp;
        },
        [id, role]
    );

    const startPolling = useCallback(
        (referenceNumber: string, transactionId: string, callbacks: PollCallbacks) => {
            stopPolling();
            setIsPolling(true);
            pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
            consecutiveErrorsRef.current = 0;

            const tick = async () => {
                const resp = await checkStatus(referenceNumber, transactionId);

                if (!resp || !resp.status) {
                    consecutiveErrorsRef.current += 1;
                    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
                        stopPolling();
                        callbacks.onFailed();
                    }
                    return;
                }
                consecutiveErrorsRef.current = 0;

                const { data } = resp;
                if (data && data.status === 'success') {
                    stopPolling();
                    callbacks.onSuccess(data);
                    return;
                }
                if (data && data.status === 'failed') {
                    stopPolling();
                    callbacks.onFailed();
                    return;
                }
                if (Date.now() >= pollDeadlineRef.current) {
                    stopPolling();
                    callbacks.onTimeout();
                }
            };

            tick();
            pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS);
        },
        [checkStatus, stopPolling]
    );

    return {
        isGeneratingLink,
        generateLink,
        isPolling,
        startPolling,
        stopPolling,
    };
}

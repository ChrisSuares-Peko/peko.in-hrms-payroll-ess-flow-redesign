import { useCallback, useEffect, useRef, useState } from 'react';

import Pusher from 'pusher-js';

import { VITE_PUSHER_APPKEY } from '@src/config-global';
import { useAppSelector } from '@src/hooks/store';

import { getSubscriptionTransactionStatusApi } from '../api/index';

type SubscriptionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | null;

const POLL_DELAY_MS = 5000;
const MAX_FAILURES = 2;
// Cap background re-polls when the backend keeps returning PENDING. The Pusher
// notification is the primary fast-path; this polling is only the safety net for
// when Pusher misses delivery. After this many attempts we surface the
// contact-support CTA instead of polling forever.
const MAX_PENDING_ATTEMPTS = 2;

export const useSubscriptionStatusPoll = (transactionId: string | null, paymentRefId?: string) => {
    const { role, id, username } = useAppSelector(state => state.reducer.auth);
    const [status, setStatus] = useState<SubscriptionStatus>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(POLL_DELAY_MS / 1000);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isFetchingRef = useRef(false);
    const failureCountRef = useRef(0);
    const pendingAttemptsRef = useRef(0);

    const startCountdown = useCallback(() => {
        setCountdown(POLL_DELAY_MS / 1000);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const checkStatus = useCallback(async (isFinal = false) => {
        if (!transactionId || !id || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsPolling(true);
        if (countdownRef.current) clearInterval(countdownRef.current);
        const result = await getSubscriptionTransactionStatusApi({
            userId: id,
            userType: role,
            transactionId,
            paymentRefId,
        });
        setIsPolling(false);
        isFetchingRef.current = false;
        if (result) {
            failureCountRef.current = 0;
            const normalized = result.status.toUpperCase() === 'FAILURE' ? 'FAILED' : result.status.toUpperCase();
            setStatus(normalized as SubscriptionStatus);
            // SUCCESS/FAILED cause the page to navigate away. For PENDING:
            //   - isFinal=true (called from the Pusher handler): the backend just fired a
            //     notification for this user, so the AUTH event has already been processed.
            //     If the status is still PENDING, retrying won't change anything — surface the
            //     contact-support CTA and stop.
            //   - isFinal=false (background poll): keep polling as the safety net for when
            //     Pusher misses the event, up to MAX_PENDING_ATTEMPTS.
            if (normalized === 'PENDING') {
                if (isFinal) {
                    setError(
                        'We could not confirm your subscription status. Please check your transaction history or contact support for assistance.'
                    );
                } else {
                    pendingAttemptsRef.current += 1;
                    if (pendingAttemptsRef.current >= MAX_PENDING_ATTEMPTS) {
                        setError(
                            'We could not confirm your subscription status. Please check your transaction history or contact support for assistance.'
                        );
                    } else {
                        timerRef.current = setTimeout(() => {
                            checkStatus();
                        }, POLL_DELAY_MS);
                        startCountdown();
                    }
                }
            }
        } else {
            failureCountRef.current += 1;
            if (failureCountRef.current >= MAX_FAILURES) {
                setError(
                    'We could not confirm your subscription status. Please check your transaction history or contact support for assistance.'
                );
            } else {
                setError('Unable to fetch status. Retrying…');
                // Schedule a retry after the next poll delay
                timerRef.current = setTimeout(() => {
                    setError(null);
                    checkStatus();
                }, POLL_DELAY_MS);
                startCountdown();
            }
        }
    }, [transactionId, paymentRefId, id, role, startCountdown]);

    // Start the 20-second countdown + timer on mount
    useEffect(() => {
        if (!transactionId) return;
        startCountdown();
        timerRef.current = setTimeout(() => {
            checkStatus();
        }, POLL_DELAY_MS);

        // eslint-disable-next-line consistent-return
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [transactionId, checkStatus, startCountdown]);

    // Pusher: if a notification arrives for this user, cancel the polling timer and run a
    // single final check. If that check still reports PENDING, do not retry — checkStatus()
    // will surface the contact-support CTA via the isFinal=true branch.
    useEffect(() => {
        if (!transactionId) return;
        const pusher = new Pusher(VITE_PUSHER_APPKEY, { cluster: 'ap2' });
        const channel = pusher.subscribe('push-notification');
        channel.bind('real-time-notification', (data: any) => {
            if (role === 'corporate' && (data.body === username || data.body === 'ALL')) {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
                if (countdownRef.current) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                }
                checkStatus(true);
            }
        });

        // eslint-disable-next-line consistent-return
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [transactionId, checkStatus, username, role]);

    const retry = useCallback(() => {
        failureCountRef.current = 0;
        pendingAttemptsRef.current = 0;
        isFetchingRef.current = false;
        setError(null);
        setStatus(null);
        checkStatus();
    }, [checkStatus]);

    return { status, isPolling, error, countdown, retry };
};

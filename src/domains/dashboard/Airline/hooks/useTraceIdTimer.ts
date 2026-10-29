import { useEffect, useState, useCallback, useRef } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useRestartFlightBooking from './useRestartFlightBooking';

// Session budget measured from search. Kept BELOW TBO's ~15-min session TTL so the backend can
// still finish ticketing both legs (sequential Ticket calls) before the session expires — a
// too-slow payment now times out on the client (clean re-search) instead of failing after
// payment with a released leg. Pairs with the paymentGateway session-timing guard.
const EXPIRATION_TIME_MS = 12 * 60 * 1000; // 12 minutes in milliseconds

interface TimerState {
    timeRemaining: number; // in seconds
    isExpired: boolean;
    isPaymentExpired: boolean;
}

/**
 * Hook to track traceId expiration times
 * - For LCC: Payment must be done within 15 minutes from search initiation
 * - For non-LCC: Booking must be done within 15 minutes from search initiation, 
 *   then payment must be done within 15 minutes from booking completion
 */
export default function useTraceIdTimer(isLcc: boolean,
  enabled: boolean,
  // Timer keeps running, modal withheld: "Go Back" mid-charge would strand the user.
  suppressExpiredModal = false) {
    const dispatch = useAppDispatch();
    const restartFlightBooking = useRestartFlightBooking();
    const { searchInitiatedAt, bookingCompletedAt } = useAppSelector(
        state => state.reducer.airline
    );

    const [timerState, setTimerState] = useState<TimerState>({
        timeRemaining: 0,
        isExpired: false,
        isPaymentExpired: false,
    });
    const [showExpiredModal, setShowExpiredModal] = useState(false);

    // Track if we've already shown expiration toasts and redirected to prevent duplicates
    const hasShownBookingExpiredToast = useRef(false);
    const hasShownPaymentExpiredToast = useRef(false);
    const hasRedirectedOnExpiration = useRef(false);
    const lastWarningMinute = useRef<number | null>(null);

    const calculateTimeRemaining = useCallback(() => {
        if (!enabled) {
            return {
                timeRemaining: 0,
                isExpired: false,
                isPaymentExpired: false,
            };
        }
        if (!searchInitiatedAt) {
            return {
                timeRemaining: 0,
                isExpired: false,
                isPaymentExpired: false,
            };
        }

        const now = new Date().getTime();
        const searchTime = new Date(searchInitiatedAt).getTime();
        const elapsed = now - searchTime;

        if (isLcc) {
            // For LCC: Payment must be done within 15 minutes from search
            const remaining = Math.max(0, EXPIRATION_TIME_MS - elapsed);
            const isExpired = remaining === 0;

            return {
                timeRemaining: Math.floor(remaining / 1000),
                isExpired,
                isPaymentExpired: isExpired,
            };
        }
        // For non-LCC: 
        // - Booking must be done within 15 minutes from search
        // - Payment must be done within 15 minutes from booking completion
        const bookingTimeRemaining = Math.max(0, EXPIRATION_TIME_MS - elapsed);
        const isBookingExpired = bookingTimeRemaining === 0;

        if (!bookingCompletedAt) {
            // Booking not completed yet
            return {
                timeRemaining: Math.floor(bookingTimeRemaining / 1000),
                isExpired: isBookingExpired,
                isPaymentExpired: false, // Payment timer starts after booking
            };
        }
        // Booking completed, now track payment timer
        const bookingTime = new Date(bookingCompletedAt).getTime();
        const paymentElapsed = now - bookingTime;
        const paymentTimeRemaining = Math.max(0, EXPIRATION_TIME_MS - paymentElapsed);
        const isPaymentExpired = paymentTimeRemaining === 0;

        return {
            timeRemaining: Math.floor(paymentTimeRemaining / 1000),
            isExpired: isBookingExpired, // Booking expiration status
            isPaymentExpired,
        };
    }, [enabled,searchInitiatedAt, bookingCompletedAt, isLcc]);

    useEffect(() => {
        // Reset toast flags when search is initiated or booking is completed
        if (searchInitiatedAt) {
            hasShownBookingExpiredToast.current = false;
            hasRedirectedOnExpiration.current = false;
        }
        if (bookingCompletedAt) {
            hasShownPaymentExpiredToast.current = false;
            hasRedirectedOnExpiration.current = false;
            lastWarningMinute.current = null;
        }
    }, [searchInitiatedAt, bookingCompletedAt]);

    useEffect(() => {
        if (!enabled) {
            // Timer isn't active for this flow (e.g. the shared payment page mounted for a
            // non-airline product). Clear any stale expiry state so the flight session-expired
            // modal can't leak onto another product's payment screen.
            setShowExpiredModal(false);
            setTimerState({ timeRemaining: 0, isExpired: false, isPaymentExpired: false });
            hasShownBookingExpiredToast.current = false;
            hasShownPaymentExpiredToast.current = false;
            hasRedirectedOnExpiration.current = false;
            lastWarningMinute.current = null;
            return undefined;
        }
        const updateTimer = () => {
            const state = calculateTimeRemaining();
            setTimerState(state);

            // Show warning toast when 2 minutes remaining (only once per minute)
            if (state.timeRemaining > 0 && state.timeRemaining <= 120) {
                const currentMinute = Math.floor(state.timeRemaining / 60);
                if (currentMinute !== lastWarningMinute.current && state.timeRemaining % 60 === 0) {
                    lastWarningMinute.current = currentMinute;
                    let action = 'complete booking';
                    if (isLcc) {
                        action = 'complete payment';
                    } else if (bookingCompletedAt) {
                        action = 'complete payment';
                    }
                    dispatch(
                        showToast({
                            description: `Hurry! Only ${currentMinute} minute(s) left to ${action}.`,
                            variant: 'warning',
                        })
                    );
                }
            }

            // Handle expiration: show toast and redirect
            // Only reset booking-related state, preserve search form data (from, to, date, class, passengers)
            if (state.isExpired && !isLcc && !bookingCompletedAt && !hasShownBookingExpiredToast.current) {
                hasShownBookingExpiredToast.current = true;
                hasRedirectedOnExpiration.current = true;
                setShowExpiredModal(true);
            } else if (state.isPaymentExpired && !hasShownPaymentExpiredToast.current) {
                hasShownPaymentExpiredToast.current = true;
                hasRedirectedOnExpiration.current = true;
                setShowExpiredModal(true);
            }
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [enabled,calculateTimeRemaining, isLcc, bookingCompletedAt, dispatch]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `00:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleGoBack = () => {
        setShowExpiredModal(false);
        restartFlightBooking();
    };

    return {
        ...timerState,
        formatTime,
        searchInitiatedAt,
        bookingCompletedAt,
        showExpiredModal: enabled && showExpiredModal && !suppressExpiredModal,
        handleGoBack,
    };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { clearBusSearchResponse } from '../slices/busTicketSlice';

export default function useBusPaymentTimer(enabled: boolean) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { blockInitiatedAt, blockTime } = useAppSelector(state => state.reducer.busTicket);

    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isExpired, setIsExpired] = useState(false);
    const [showExpiredModal, setShowExpiredModal] = useState(false);

    const hasShownExpiredModal = useRef(false);
    const lastWarningMinute = useRef<number | null>(null);

    const calculateTimeRemaining = useCallback(() => {
        if (!enabled || !blockInitiatedAt) return 0;

        const now = Date.now();
        const initiatedAt = new Date(blockInitiatedAt).getTime();
        const expiresAt = initiatedAt + blockTime * 1000;
        return Math.max(0, Math.floor((expiresAt - now) / 1000));
    }, [enabled, blockInitiatedAt, blockTime]);

    useEffect(() => {
        hasShownExpiredModal.current = false;
        lastWarningMinute.current = null;
    }, [blockInitiatedAt]);

    useEffect(() => {
        if (!enabled) return undefined;

        const tick = () => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);
            setIsExpired(remaining === 0);

            if (remaining > 0 && remaining <= 120) {
                const currentMinute = Math.floor(remaining / 60);
                if (currentMinute !== lastWarningMinute.current && remaining % 60 === 0) {
                    lastWarningMinute.current = currentMinute;
                    dispatch(
                        showToast({
                            description: `Hurry! Only ${currentMinute} minute(s) left to complete payment.`,
                            variant: 'warning',
                        })
                    );
                }
            }

            if (remaining === 0 && !hasShownExpiredModal.current) {
                hasShownExpiredModal.current = true;
                setShowExpiredModal(true);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [enabled, calculateTimeRemaining, dispatch]);

    const formatTime = (seconds: number): string => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleGoBack = () => {
        setShowExpiredModal(false);
        dispatch(clearBusSearchResponse());
        navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}`);
    };

    return {
        timeRemaining,
        isExpired,
        showExpiredModal,
        formatTime,
        handleGoBack,
    };
}

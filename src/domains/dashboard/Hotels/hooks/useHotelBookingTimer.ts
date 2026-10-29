import { useEffect, useState, useCallback, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { resetData, resetUserData, resetUserDetails } from '../slices/getHotelSlice';


const TOTAL_TIME_MS = 40 * 60 * 1000;
const WARNING_WINDOW_MS = 15 * 60 * 1000;

export default function useHotelBookingTimer(enabled: boolean) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { searchInitiatedAt } = useAppSelector(
        state => state.reducer.hotels
    );

    const [state, setState] = useState({
        timeRemaining: 0,
        showTimer: false,
        isExpired: false,
    });

    const hasShownExpiredToast = useRef(false);
    const lastWarningMinute = useRef<number | null>(null);

    const calculateTimer = useCallback(() => {
        if (!enabled || !searchInitiatedAt) {
            return { timeRemaining: 0, showTimer: false, isExpired: false };
        }

        const now = Date.now();
        const searchTime = new Date(searchInitiatedAt).getTime();
        const elapsed = now - searchTime;

        // Booking expired
        if (elapsed >= TOTAL_TIME_MS) {
            return {
                timeRemaining: 0,
                showTimer: false,
                isExpired: true,
            };
        }

        const remainingTotal = TOTAL_TIME_MS - elapsed;

        // Show timer only in last 15 minutes
        if (remainingTotal <= WARNING_WINDOW_MS) {
            return {
                timeRemaining: Math.floor(remainingTotal / 1000),
                showTimer: true,
                isExpired: false,
            };
        }

        return {
            timeRemaining: 0,
            showTimer: false,
            isExpired: false,
        };
    }, [enabled, searchInitiatedAt]);

    useEffect(() => {
        if (!enabled) {
            // Timer isn't active for this flow (e.g. the shared payment page mounted for a
            // non-hotel product). Clear stale timer state so a hotel countdown can't linger
            // on another product's payment screen.
            setState({ timeRemaining: 0, showTimer: false, isExpired: false });
            hasShownExpiredToast.current = false;
            lastWarningMinute.current = null;
            return undefined;
        }

        const updateTimer = () => {
            const timerState = calculateTimer();
            setState(timerState);

            // Warning toast (last 2 minutes)
            if (
                timerState.showTimer &&
                timerState.timeRemaining > 0 &&
                timerState.timeRemaining <= 120
            ) {
                const currentMinute = Math.floor(timerState.timeRemaining / 60);
                if (
                    currentMinute !== lastWarningMinute.current &&
                    timerState.timeRemaining % 60 === 0
                ) {
                    lastWarningMinute.current = currentMinute;
                    dispatch(
                        showToast({
                            description: `Hurry! Only ${currentMinute} minute(s) left to complete booking.`,
                            variant: 'warning',
                        })
                    );
                }
            }

            // Expiry handling
            if (timerState.isExpired && !hasShownExpiredToast.current) {
                hasShownExpiredToast.current = true;

                dispatch(
                    showToast({
                        description: 'Booking time has expired. Please search again.',
                        variant: 'error',
                    })
                );

                dispatch(resetData());
                dispatch(resetUserDetails());
                dispatch(resetUserData());


                navigate(
                    `${paths.dashboard.corporateTravel}/${paths.hotels.index}/${paths.hotels.details}`,
                    { state: { hotelKey: 'searchHotels' } }
                );
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [enabled, calculateTimer, dispatch, navigate]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `00:${m.toString().padStart(2, '0')}:${s
            .toString()
            .padStart(2, '0')}`;
    };

    return {
        ...state,
        formatTime,
        searchInitiatedAt,
    };
}

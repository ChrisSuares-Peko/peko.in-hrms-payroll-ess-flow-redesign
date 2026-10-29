import { useCallback, useEffect, useRef } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { triggerSessionExpired } from '@src/services/handleLogout';

const IDLE_THRESHOLD_MS = 29 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'mousemove',
];

const useIdleDetection = () => {
    const { isAuthenticated } = useAppSelector(state => state.reducer.auth);

    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivityRef = useRef(0);
    const hasFiredRef = useRef(false);

    const clearIdleTimer = useCallback(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
    }, []);

    const startIdleTimer = useCallback(() => {
        clearIdleTimer();
        idleTimerRef.current = setTimeout(() => {
            if (hasFiredRef.current) return;
            hasFiredRef.current = true;
            triggerSessionExpired();
        }, IDLE_THRESHOLD_MS);
    }, [clearIdleTimer]);

    useEffect(() => {
        if (!isAuthenticated) {
            clearIdleTimer();
            return undefined;
        }

        const handleActivity = () => {
            if (hasFiredRef.current) return;
            const now = Date.now();
            if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
            lastActivityRef.current = now;
            startIdleTimer();
        };

        ACTIVITY_EVENTS.forEach(eventName => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });
        startIdleTimer();

        return () => {
            ACTIVITY_EVENTS.forEach(eventName => {
                window.removeEventListener(eventName, handleActivity);
            });
            clearIdleTimer();
        };
    }, [isAuthenticated, startIdleTimer, clearIdleTimer]);
};

export default useIdleDetection;

import { useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import type { RootState } from '@store/store';

import type { SessionInfo } from '../../types/eInvoice';
import {
    computeProgress,
    formatExpiry,
    formatTimeLeft,
} from '../../utils/eInvoiceSession';

export const useEInvoiceAuth = () => {
    const eInvoiceAuth = useSelector((state: RootState) => state.reducer.eInvoiceAuth);
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!eInvoiceAuth.tokenExpiry) return undefined;
        const remaining = new Date(eInvoiceAuth.tokenExpiry).getTime() - Date.now();
        if (remaining <= 0) return undefined;
        const interval = remaining < 60 * 60 * 1000 ? 1000 : 60000;
        const id = setInterval(() => setTick(t => t + 1), interval);
        return () => clearInterval(id);
    }, [eInvoiceAuth.tokenExpiry]);

    const isAuthenticated =
        !!eInvoiceAuth.authToken &&
        !!eInvoiceAuth.tokenExpiry &&
        new Date(eInvoiceAuth.tokenExpiry) > new Date();

    const sessionInfo: SessionInfo = {
        isActive: isAuthenticated,
        timeLeft: formatTimeLeft(eInvoiceAuth.tokenExpiry),
        progressPercent: computeProgress(eInvoiceAuth.tokenExpiry),
        gstin: eInvoiceAuth.gstin ?? '—',
        clientId: eInvoiceAuth.clientId ?? '—',
        expiresAt: formatExpiry(eInvoiceAuth.tokenExpiry),
    };

    return { isAuthenticated, sessionInfo };
};

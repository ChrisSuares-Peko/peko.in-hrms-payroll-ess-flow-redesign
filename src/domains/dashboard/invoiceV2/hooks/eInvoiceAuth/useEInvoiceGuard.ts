import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';

import { useEInvoiceAuth } from './useEInvoiceAuth';
import { getEInvoiceSessionStatusApi } from '../../api/eInvoice';
import { setEInvoiceAuth, setForcedLogout } from '../../slices/eInvoiceAuthSlice';

export const useEInvoiceGuard = (requireAuth = true) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useEInvoiceAuth();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const forcedLogout = useAppSelector(state => state.reducer.eInvoiceAuth.forcedLogout);
    const [isChecking, setIsChecking] = useState(true);
    const sessionChecked = useRef(false);

    useEffect(() => {
        if (sessionChecked.current) return;
        sessionChecked.current = true;

        if (isAuthenticated) {
            if (!requireAuth) {
                navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`, { replace: true });
            }
            setIsChecking(false);
            return;
        }

        if (forcedLogout) {
            dispatch(setForcedLogout(false));
            setIsChecking(false);
            return;
        }
    
        const checkSession = async () => {
            const session = await getEInvoiceSessionStatusApi({ userId: id, userType: role });
            if (
                session?.authToken &&
                session?.tokenExpiry &&
                new Date(session.tokenExpiry) > new Date()
            ) {
                dispatch(setEInvoiceAuth({
                    authToken: session.authToken,
                    tokenExpiry: session.tokenExpiry,
                    gstin: session.gstin,
                    clientId: session.username,
                }));
                if (!requireAuth) {
                    navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`, { replace: true });
                }
            } else if (requireAuth) {
                navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingSignIn}`, { replace: true });
            }
            setIsChecking(false);
        };

        checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { isChecking };
};

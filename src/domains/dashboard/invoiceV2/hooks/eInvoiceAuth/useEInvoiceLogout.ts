import { useCallback, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import type { AppDispatch, RootState } from '@store/store';

import { eInvoiceLogoutApi } from '../../api/eInvoice';
import { clearEInvoiceAuth, setForcedLogout } from '../../slices/eInvoiceAuthSlice';

export const useEInvoiceLogout = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { id: userId, role: userType } = useSelector((state: RootState) => state.reducer.auth);

    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        await eInvoiceLogoutApi({ userId, userType });
        dispatch(clearEInvoiceAuth());
        dispatch(setForcedLogout(true));
        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingSignIn}`, { replace: true });
        setIsLoggingOut(false);
    }, [userId, userType, dispatch, navigate]);

    return { logout, isLoggingOut };
};

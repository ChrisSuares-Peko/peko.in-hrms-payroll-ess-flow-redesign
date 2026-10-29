import { useCallback, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import type { AppDispatch, RootState } from '@store/store';

import { eInvoiceSignInApi } from '../../api/eInvoice';
import { setEInvoiceAuth } from '../../slices/eInvoiceAuthSlice';
import { EInvoiceSignInValues } from '../../types/eInvoicingSign';

export const useEInvoiceSignIn = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { id: userId, role: userType } = useSelector((state: RootState) => state.reducer.auth);

    const signIn = useCallback(
        async (values: EInvoiceSignInValues) => {
            setIsLoading(true);
            setError(null);

            const resp = await eInvoiceSignInApi({
                userId,
                userType,
                gstin: values.gstin,
                username: values.clientId,
                password: values.password,
            });

            if (resp && resp.status) {
                dispatch(
                    setEInvoiceAuth({
                        authToken: resp.data.authToken,
                        tokenExpiry: resp.data.tokenExpiry,
                        gstin: resp.data.gstin || values.gstin,
                        clientId: resp.data.username || values.clientId,
                    })
                );
                navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`);
            } else {
                setError(resp ? resp.message : 'Sign in failed. Please try again.');
            }

            setIsLoading(false);
        },
        [userId, userType, dispatch, navigate]
    );

    return { signIn, isLoading, error };
};

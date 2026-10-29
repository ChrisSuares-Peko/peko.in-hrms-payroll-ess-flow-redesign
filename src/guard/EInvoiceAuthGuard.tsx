import React from 'react';

import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

import { paths } from '@routes/paths';
import type { RootState } from '@store/store';

const EInvoiceAuthGuard: React.FC = () => {
    const { authToken, tokenExpiry } = useSelector(
        (state: RootState) => state.reducer.eInvoiceAuth
    );

    const isAuthenticated = !!authToken && !!tokenExpiry && new Date(tokenExpiry) > new Date();

    if (!isAuthenticated) {
        return (
            <Navigate to={`/${paths.invoice.index}/${paths.invoice.eInvoicingSignIn}`} replace />
        );
    }

    return <Outlet />;
};

export default EInvoiceAuthGuard;

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceSessionStatusApi } from '../../../api/eInvoice';
import { useEInvoiceGuard } from '../../../hooks/eInvoiceAuth/useEInvoiceGuard';
import { setEInvoiceAuth } from '../../../slices/eInvoiceAuthSlice';

vi.mock('../../../api/eInvoice', () => ({
    getEInvoiceSessionStatusApi: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const isAuthMock = vi.fn();
vi.mock('../../../hooks/eInvoiceAuth/useEInvoiceAuth', () => ({
    useEInvoiceAuth: () => ({ isAuthenticated: isAuthMock() }),
}));

describe('useEInvoiceGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not navigate when already authenticated and requireAuth=true', async () => {
        isAuthMock.mockReturnValue(true);
        const { result } = renderHook(() => useEInvoiceGuard(true));

        await waitFor(() => expect(result.current.isChecking).toBe(false));
        expect(navigateMock).not.toHaveBeenCalled();
        expect(getEInvoiceSessionStatusApi).not.toHaveBeenCalled();
    });

    it('redirects to e-invoicing dashboard when authenticated and requireAuth=false', async () => {
        isAuthMock.mockReturnValue(true);
        const { result } = renderHook(() => useEInvoiceGuard(false));

        await waitFor(() => expect(result.current.isChecking).toBe(false));
        expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('e-invoicing'), {
            replace: true,
        });
    });

    it('hydrates auth from server session when not authenticated', async () => {
        isAuthMock.mockReturnValue(false);
        (getEInvoiceSessionStatusApi as Mock).mockResolvedValue({
            authToken: 'tok',
            tokenExpiry: new Date(Date.now() + 60_000).toISOString(),
            gstin: 'GSTIN',
            username: 'user1',
        });

        const { result } = renderHook(() => useEInvoiceGuard(true));

        await waitFor(() => expect(result.current.isChecking).toBe(false));
        expect(dispatchMock).toHaveBeenCalledWith(
            setEInvoiceAuth({
                authToken: 'tok',
                tokenExpiry: expect.any(String),
                gstin: 'GSTIN',
                clientId: 'user1',
            })
        );
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('navigates to sign-in when no server session and requireAuth=true', async () => {
        isAuthMock.mockReturnValue(false);
        (getEInvoiceSessionStatusApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useEInvoiceGuard(true));

        await waitFor(() => expect(result.current.isChecking).toBe(false));
        expect(navigateMock).toHaveBeenCalledWith(
            expect.stringContaining('e-invoicing-sign-in'),
            { replace: true }
        );
    });

    it('does not navigate to sign-in when requireAuth=false and session missing', async () => {
        isAuthMock.mockReturnValue(false);
        (getEInvoiceSessionStatusApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useEInvoiceGuard(false));

        await waitFor(() => expect(result.current.isChecking).toBe(false));
        expect(navigateMock).not.toHaveBeenCalled();
    });
});

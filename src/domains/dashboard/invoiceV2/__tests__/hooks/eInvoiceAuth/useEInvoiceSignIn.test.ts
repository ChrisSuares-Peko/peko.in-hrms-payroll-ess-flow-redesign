import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { eInvoiceSignInApi } from '../../../api/eInvoice';
import { useEInvoiceSignIn } from '../../../hooks/eInvoiceAuth/useEInvoiceSignIn';
import { setEInvoiceAuth } from '../../../slices/eInvoiceAuthSlice';

vi.mock('../../../api/eInvoice', () => ({
    eInvoiceSignInApi: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
    useDispatch: () => dispatchMock,
    useSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 'u1', role: 'admin' } } }),
}));

const baseValues = {
    gstin: '29ABCDE1234F1Z5',
    clientId: 'client-1',
    password: 'p@ss',
};

describe('useEInvoiceSignIn', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dispatches auth and navigates on success', async () => {
        (eInvoiceSignInApi as Mock).mockResolvedValue({
            status: true,
            data: {
                authToken: 'tok',
                tokenExpiry: '2026-12-31T00:00:00Z',
                gstin: '29ABCDE1234F1Z5',
                username: 'client-1',
            },
        });

        const { result } = renderHook(() => useEInvoiceSignIn());

        await act(async () => {
            await result.current.signIn(baseValues);
        });

        expect(eInvoiceSignInApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            gstin: baseValues.gstin,
            username: baseValues.clientId,
            password: baseValues.password,
        });
        expect(dispatchMock).toHaveBeenCalledWith(
            setEInvoiceAuth({
                authToken: 'tok',
                tokenExpiry: '2026-12-31T00:00:00Z',
                gstin: '29ABCDE1234F1Z5',
                clientId: 'client-1',
            })
        );
        expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('e-invoicing'));
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('falls back to provided gstin/clientId when response omits them', async () => {
        (eInvoiceSignInApi as Mock).mockResolvedValue({
            status: true,
            data: {
                authToken: 'tok',
                tokenExpiry: '2026-12-31T00:00:00Z',
                gstin: '',
                username: '',
            },
        });

        const { result } = renderHook(() => useEInvoiceSignIn());

        await act(async () => {
            await result.current.signIn(baseValues);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            setEInvoiceAuth({
                authToken: 'tok',
                tokenExpiry: '2026-12-31T00:00:00Z',
                gstin: baseValues.gstin,
                clientId: baseValues.clientId,
            })
        );
    });

    it('sets error message when response status is false', async () => {
        (eInvoiceSignInApi as Mock).mockResolvedValue({ status: false, message: 'Bad creds' });

        const { result } = renderHook(() => useEInvoiceSignIn());

        await act(async () => {
            await result.current.signIn(baseValues);
        });

        expect(result.current.error).toBe('Bad creds');
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('shows generic error when API throws', async () => {
        (eInvoiceSignInApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useEInvoiceSignIn());

        await act(async () => {
            await result.current.signIn(baseValues);
        });

        expect(result.current.error).toBe('Sign in failed. Please try again.');
    });
});

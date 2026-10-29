import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { eInvoiceLogoutApi } from '../../../api/eInvoice';
import { useEInvoiceLogout } from '../../../hooks/eInvoiceAuth/useEInvoiceLogout';
import { clearEInvoiceAuth } from '../../../slices/eInvoiceAuthSlice';

vi.mock('../../../api/eInvoice', () => ({
    eInvoiceLogoutApi: vi.fn(),
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

describe('useEInvoiceLogout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls logout API, dispatches clear action and navigates to sign-in', async () => {
        (eInvoiceLogoutApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useEInvoiceLogout());

        await act(async () => {
            await result.current.logout();
        });

        expect(eInvoiceLogoutApi).toHaveBeenCalledWith({ userId: 'u1', userType: 'admin' });
        expect(dispatchMock).toHaveBeenCalledWith(clearEInvoiceAuth());
        expect(navigateMock).toHaveBeenCalledWith(
            expect.stringContaining('e-invoicing-sign-in'),
            { replace: true }
        );
        expect(result.current.isLoggingOut).toBe(false);
    });

    it('still dispatches clear and navigates if logout API fails', async () => {
        (eInvoiceLogoutApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useEInvoiceLogout());
        await act(async () => {
            await result.current.logout();
        });

        expect(dispatchMock).toHaveBeenCalledWith(clearEInvoiceAuth());
        expect(navigateMock).toHaveBeenCalled();
    });
});

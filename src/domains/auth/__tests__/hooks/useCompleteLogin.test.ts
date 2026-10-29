import { renderHook, act } from '@testing-library/react';
import { signInWithCustomToken } from 'firebase/auth';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { paths } from '@src/routes/paths';
import { takePendingIdpToken } from '@src/services/idpPendingRequest';

import useCompleteLogin from '../../hooks/useCompleteLogin';
import { loginSuccess } from '../../slices/loginSlice';
import { LoginResponse } from '../../types';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();
const mockPostMessage = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (state: any) => any) =>
        selector({ reducer: { auth: { redirectUrl: '' } } }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('firebase/auth', () => ({
    signInWithCustomToken: vi.fn(),
}));

vi.mock('@src/domains/dashboard/pekoConnect/config/firebaseConfig', () => ({
    auth: {},
}));

vi.mock('@src/services/idpPendingRequest', () => ({
    takePendingIdpToken: vi.fn(),
}));

vi.mock('@src/utils/tabId', () => ({
    TAB_ID: 'test-tab',
}));

const mockSignInWithCustomToken = signInWithCustomToken as Mock;
const mockTakePendingIdpToken = takePendingIdpToken as Mock;

vi.stubGlobal(
    'BroadcastChannel',
    class {
        postMessage = mockPostMessage;

        close = vi.fn();
    }
);
vi.stubGlobal('Moengage', undefined);

const baseResponse = {
    token: 't',
    refreshToken: 'rt',
    firebaseToken: '',
    role: 'corporate',
    id: 1,
    username: 'acme',
    roleName: 'corporate',
    email: '',
    sessionId: 's1',
    packageName: 'free',
} as LoginResponse;

beforeEach(() => {
    vi.clearAllMocks();
    mockTakePendingIdpToken.mockReturnValue(null);
    mockSignInWithCustomToken.mockResolvedValue(undefined);
});

describe('useCompleteLogin', () => {
    it('dispatches loginSuccess with the response, authenticated flag and redirectUrl', async () => {
        const { result } = renderHook(() => useCompleteLogin());

        await act(() => result.current.completeLogin(baseResponse));

        expect(mockDispatch).toHaveBeenCalledWith(
            loginSuccess({ ...baseResponse, isAuthenticated: true, redirectUrl: '' })
        );
        expect(mockPostMessage).toHaveBeenCalledWith({ type: 'login', tabId: 'test-tab' });
    });

    it('resumes a parked IDP authorization request via the consent screen', async () => {
        mockTakePendingIdpToken.mockReturnValue('pending-token');
        const { result } = renderHook(() => useCompleteLogin());

        await act(() => result.current.completeLogin(baseResponse));

        expect(mockNavigate).toHaveBeenCalledWith(`${paths.auth.jwt.consent}?token=pending-token`, {
            replace: true,
        });
    });

    it('falls back to the role-based destination when nothing is parked', async () => {
        const { result } = renderHook(() => useCompleteLogin());

        await act(() => result.current.completeLogin({ ...baseResponse, role: 'system_user' }));
        expect(mockNavigate).toHaveBeenCalledWith(paths.systemUser.dashboard, { replace: true });

        mockNavigate.mockClear();
        await act(() => result.current.completeLogin(baseResponse));
        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.home, {
            replace: true,
            state: undefined,
        });
    });

    it('does not sign in to Firebase when the response has no firebaseToken', async () => {
        const { result } = renderHook(() => useCompleteLogin());

        await act(() => result.current.completeLogin(baseResponse));

        expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
    });

    it('logs but does not block the login when Firebase sign-in fails', async () => {
        mockSignInWithCustomToken.mockRejectedValue(new Error('firebase down'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useCompleteLogin());

        await act(() =>
            result.current.completeLogin({ ...baseResponse, firebaseToken: 'fb-token' })
        );

        expect(mockSignInWithCustomToken).toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.home, {
            replace: true,
            state: undefined,
        });
        consoleError.mockRestore();
    });
});

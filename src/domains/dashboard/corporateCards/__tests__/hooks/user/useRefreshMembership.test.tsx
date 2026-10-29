import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useRefreshMembership } from '../../../hooks/user/useRefreshMembership';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({ useAppDispatch: () => mockDispatch }));
vi.mock('@src/services/refreshToken', () => ({ updateRefreshToken: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: unknown) => ({ type: 'toast', payload }),
}));
vi.mock('@src/domains/auth/slices/loginSlice', () => ({
    loginSuccess: (payload: unknown) => ({ type: 'loginSuccess', payload }),
}));

const { updateRefreshToken } = await import('@src/services/refreshToken');

const rotated = (overrides = {}) => ({
    data: {
        data: {
            token: 'new-token',
            refreshToken: 'new-refresh',
            sessionId: 's2',
            employeeProfileId: 77,
            serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, status: 'ACTIVE' }],
            ...overrides,
        },
    },
});

const dispatchedLogin = () =>
    mockDispatch.mock.calls
        .map(([action]) => action)
        .find(action => action.type === 'loginSuccess');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useRefreshMembership', () => {
    it('lands the newly granted membership in the session', async () => {
        (updateRefreshToken as Mock).mockResolvedValue(rotated());
        const { result } = renderHook(() => useRefreshMembership());

        let ok: boolean | undefined;
        await act(async () => {
            ok = await result.current.refreshMembership();
        });

        expect(ok).toBe(true);
        expect(dispatchedLogin().payload).toEqual(
            expect.objectContaining({
                token: 'new-token',
                employeeProfileId: 77,
                serviceMemberships: [
                    { label: 'Corporate Cards', hasAccess: true, status: 'ACTIVE' },
                ],
            })
        );
    });

    it('reports failure rather than letting the caller open a screen the server will refuse', async () => {
        (updateRefreshToken as Mock).mockRejectedValue(new Error('401'));
        const { result } = renderHook(() => useRefreshMembership());

        let ok: boolean | undefined;
        await act(async () => {
            ok = await result.current.refreshMembership();
        });

        expect(ok).toBe(false);
        expect(dispatchedLogin()).toBeUndefined();
    });

    it('treats a rotation that returned no token as a failure', async () => {
        (updateRefreshToken as Mock).mockResolvedValue({ data: { data: {} } });
        const { result } = renderHook(() => useRefreshMembership());

        let ok: boolean | undefined;
        await act(async () => {
            ok = await result.current.refreshMembership();
        });

        expect(ok).toBe(false);
        expect(dispatchedLogin()).toBeUndefined();
    });
});

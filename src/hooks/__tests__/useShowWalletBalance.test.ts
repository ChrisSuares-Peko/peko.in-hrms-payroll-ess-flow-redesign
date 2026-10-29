import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import useShowWalletBalance from '../useShowWalletBalance';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));

const withState = ({
    role = 'corporate',
    roleName = 'corporate',
    user = { balance: '1500.00', isWalletPaymentAvailable: true } as Record<string, unknown> | null,
} = {}) => {
    (useAppSelector as Mock).mockImplementation(selector =>
        selector({
            reducer: {
                user: { user },
                auth: { role, roleName },
            },
        })
    );
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useShowWalletBalance', () => {
    it('shows the wallet to a corporate user whose partner has wallet payments enabled', () => {
        withState();

        expect(renderHook(() => useShowWalletBalance()).result.current).toBe(true);
    });

    it('hides the wallet when wallet payments are not enabled for the partner', () => {
        withState({ user: { balance: '1500.00', isWalletPaymentAvailable: false } });

        expect(renderHook(() => useShowWalletBalance()).result.current).toBe(false);
    });

    it('hides the wallet until the user details have loaded', () => {
        withState({ user: null });

        expect(renderHook(() => useShowWalletBalance()).result.current).toBe(false);
    });

    it('hides the wallet from corporate sub users', () => {
        withState({ roleName: 'corporate sub user' });

        expect(renderHook(() => useShowWalletBalance()).result.current).toBe(false);
    });

    it('hides the wallet from system users', () => {
        withState({ role: 'system_user', roleName: 'admin' });

        expect(renderHook(() => useShowWalletBalance()).result.current).toBe(false);
    });
});

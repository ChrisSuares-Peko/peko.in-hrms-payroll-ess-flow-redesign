import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getWallet } from '../../../api/admin/walletApi';
import { useWalletApi } from '../../../hooks/admin/useWalletApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/walletApi', () => ({
    getWallet: vi.fn(),
    getWalletTopUps: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makeWalletData = (overrides = {}) => ({
    balance: 500000,
    totalCardLimits: 1000000,
    cardCount: 10,
    fundingAccount: { maskedAccountNumber: '1234', ifsc: 'HDFC0001' },
    ...overrides,
});

describe('useWalletApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and wallet=null', () => {
        (getWallet as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useWalletApi());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.wallet).toBeNull();
    });

    it('sets wallet and isLoading=false after a successful fetch', async () => {
        const walletData = makeWalletData();
        (getWallet as Mock).mockResolvedValue({ data: walletData });

        const { result } = renderHook(() => useWalletApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.wallet).toEqual(walletData);
    });

    it('calls getWallet with role and id', async () => {
        (getWallet as Mock).mockResolvedValue(false);
        renderHook(() => useWalletApi());
        await waitFor(() => expect(getWallet).toHaveBeenCalledWith('admin', 1));
    });

    it('keeps wallet=null and sets isLoading=false when API returns false', async () => {
        (getWallet as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useWalletApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.wallet).toBeNull();
    });

    it('keeps wallet=null when res.data is undefined', async () => {
        (getWallet as Mock).mockResolvedValue({});
        const { result } = renderHook(() => useWalletApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.wallet).toBeNull();
    });

    it('refetch re-calls getWallet and updates wallet', async () => {
        const wallet1 = makeWalletData({ balance: 100 });
        const wallet2 = makeWalletData({ balance: 200 });
        (getWallet as Mock)
            .mockResolvedValueOnce({ data: wallet1 })
            .mockResolvedValueOnce({ data: wallet2 });

        const { result } = renderHook(() => useWalletApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.wallet?.balance).toBe(100);

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.wallet?.balance).toBe(200);
    });
});

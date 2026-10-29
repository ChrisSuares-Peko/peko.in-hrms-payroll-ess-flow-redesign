import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getWalletBalance } from '../../api/index';
import GetWalletDetails from '../../hooks/useWalletApi';
import { WalletBalanceResponse } from '../../types/types';

vi.mock('../../api/index', () => ({
    getWalletBalance: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('GetWalletDetails Hook', () => {
    const mockWalletData: WalletBalanceResponse = {
        balance: 5000,
        credentialId: 0,
        'credential.name': '',
        'credential.role': '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should return isLoading as true initially', () => {
        const { result } = renderHook(() => GetWalletDetails());
        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch and return wallet details on successful API response', async () => {
        (getWalletBalance as Mock).mockResolvedValue(mockWalletData);

        const { result } = renderHook(() => GetWalletDetails());

        await act(async () => {
            // Wait for the useEffect to complete
        });

        expect(result.current.walletData).toEqual(mockWalletData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after fetching data', async () => {
        (getWalletBalance as Mock).mockResolvedValue(mockWalletData);

        const { result } = renderHook(() => GetWalletDetails());

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getWalletBalance as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetWalletDetails());

        await act(async () => {});

        expect(result.current.walletData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getWalletBalance } from '../../api/index';
import useWalletApi from '../../hooks/useWalletApi';

vi.mock('../../api/index', () => ({
    getWalletBalance: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useWalletApi', () => {
    const mockId = '12345';
    const mockRole = 'user';

    beforeEach(() => {
        (getWalletBalance as Mock).mockReset();
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: {
                        id: mockId,
                        role: mockRole,
                    },
                },
            })
        );
        vi.clearAllMocks();
    });

    it('should return wallet details and set loading to false when API call is successful', async () => {
        const mockWalletData = {
            balance: 1000,
            currency: 'USD',
        };

        (getWalletBalance as Mock).mockResolvedValueOnce(mockWalletData);

        const { result } = renderHook(() => useWalletApi());

        expect(result.current.walletData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {});
        expect(result.current.walletData).toEqual(mockWalletData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should return fallback data when API call fails', async () => {
        (getWalletBalance as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useWalletApi());

        expect(result.current.walletData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {});

        expect(result.current.walletData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});

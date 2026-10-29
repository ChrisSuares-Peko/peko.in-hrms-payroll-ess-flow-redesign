import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getAllPrices } from '../../api';
import useGetAllPrice from '../../hooks/useGetPriceApi';

vi.mock('../../api', () => ({
    getAllPrices: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
            },
        }),
}));

describe('useGetAllPrice Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches price data on mount and exposes it', async () => {
        (getAllPrices as any).mockResolvedValue({ pan_verify: 'available' });

        const { result } = renderHook(() => useGetAllPrice());

        expect(result.current.loading).toBe(true);

        await act(async () => {});

        expect(getAllPrices).toHaveBeenCalledWith({ userId: '123', userType: 'corporate' });
        expect(result.current.priceData).toEqual({ pan_verify: 'available' });
        expect(result.current.loading).toBe(false);
    });

    it('keeps priceData undefined when the API call fails', async () => {
        (getAllPrices as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetAllPrice());

        await act(async () => {});

        expect(result.current.priceData).toBeUndefined();
        expect(result.current.loading).toBe(false);
    });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getVerificationAddOns } from '../../api';
import useGetVerificationAddOns from '../../hooks/useGetVerificationAddOns';

vi.mock('../../api', () => ({
    getVerificationAddOns: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
            },
        }),
}));

describe('useGetVerificationAddOns Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches add-ons data on mount', async () => {
        (getVerificationAddOns as any).mockResolvedValue({
            baseLimit: 10,
            addonLimit: 5,
            maxLimit: 15,
            unitPrice: 20,
        });

        const { result } = renderHook(() => useGetVerificationAddOns());

        await act(async () => {});

        expect(getVerificationAddOns).toHaveBeenCalledWith({ userId: '123', userType: 'corporate' });
        expect(result.current.addOnsData).toEqual({
            baseLimit: 10,
            addonLimit: 5,
            maxLimit: 15,
            unitPrice: 20,
        });
        expect(result.current.loading).toBe(false);
    });

    it('does not update addOnsData when the API call fails', async () => {
        (getVerificationAddOns as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetVerificationAddOns());

        await act(async () => {});

        expect(result.current.addOnsData).toBeUndefined();
        expect(result.current.loading).toBe(false);
    });
});

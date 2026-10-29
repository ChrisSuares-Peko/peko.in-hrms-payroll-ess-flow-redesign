import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import useSurchargeApi from '../../hooks/useSurchargeApi'; // ✅ Default Import

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('useSurchargeApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock Redux store selector
        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    plan: { amount: 1000 },
                },
            })
        );
    });

    it('fetches and sets surcharge data correctly', async () => {
        const mockResponse = {
            surcharge: 50,
            corporateCashback: 10,
        };

        (getSurcharge as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useSurchargeApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getSurcharge).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            amount: 1000,
            accessKey: 'workspace', // Assuming this is the correct access key
        });

        expect(result.current.surchargeData).toEqual(mockResponse);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles failed API response gracefully', async () => {
        (getSurcharge as any).mockResolvedValue(false);

        const { result } = renderHook(() => useSurchargeApi());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});

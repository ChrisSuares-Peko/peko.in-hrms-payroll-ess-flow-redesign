import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import GetSurcharge from '../../hooks/useSurchargeApi';
import { SurchargeResponse } from '../../types/types';

// Mock API and store
vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('GetSurcharge Hook', () => {
    const mockSurchargeData: SurchargeResponse = {
        surcharge: '',
        corporateCashback: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();

        (useAppSelector as Mock).mockImplementation(selector => {
            const state = {
                reducer: {
                    auth: { role: 'admin', id: '123' },
                    giftcardCheckout: {
                        formDetails: { product: '1000' }, // Ensure this returns a valid number
                        productDetails: { accessKey: 'gift-card' },
                    },
                },
            };
            return selector(state);
        });
    });

    it('should return isLoading as true initially', () => {
        const { result } = renderHook(() => GetSurcharge());
        expect(result.current.isLoading).toBe(true);
    });

    it('should fetch and return surcharge details on successful API response', async () => {
        (getSurcharge as Mock).mockResolvedValue(mockSurchargeData);

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {
            // Wait for useEffect execution
        });

        expect(result.current.surchargeData).toEqual(mockSurchargeData);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after fetching data', async () => {
        (getSurcharge as Mock).mockResolvedValue(mockSurchargeData);

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getSurcharge as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {});

        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should use correct parameters from useAppSelector', async () => {
        (getSurcharge as Mock).mockResolvedValue(mockSurchargeData);

        renderHook(() => GetSurcharge());

        await act(async () => {});

        expect(getSurcharge).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            amount: 1000,
            accessKey: 'gift-card',
            quantity: 1,
        });
    });
});

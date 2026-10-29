import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import { useSurchageApi } from '../../hooks/useSurchargeApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('useSurchageApi', () => {
    const mockRole = 'user';
    const mockId = '12345';
    const mockPaymentState = {
        earningCashbackAmount: 100,
    };

    const mockSurchargeResponse = {
        corporateCashback: 50,
    };

    const mockEarningCashbackPayload = {
        billAmount: 200,
        accessKey: 'testAccessKey',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({
                reducer: {
                    auth: {
                        role: mockRole,
                        id: mockId,
                    },
                    payment: mockPaymentState,
                },
            })
        );
    });

    it('should return the correct earning cashback when surcharge data is available', async () => {
        (getSurcharge as Mock).mockResolvedValueOnce(mockSurchargeResponse);

        const { result } = renderHook(() => useSurchageApi());

        const cashback = await act(async () =>
            result.current.getEarningCashback(mockEarningCashbackPayload)
        );

        expect(cashback).toBe(50);
        expect(getSurcharge).toHaveBeenCalledWith({
            userId: mockId,
            userType: mockRole,
            amount: mockEarningCashbackPayload.billAmount,
            accessKey: mockEarningCashbackPayload.accessKey,
        });
    });

    it('should return fallback earning cashback when no surcharge data is available', async () => {
        (getSurcharge as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useSurchageApi());

        const cashback = await act(async () =>
            result.current.getEarningCashback(mockEarningCashbackPayload)
        );

        expect(cashback).toBe(100);
        expect(getSurcharge).toHaveBeenCalledWith({
            userId: mockId,
            userType: mockRole,
            amount: mockEarningCashbackPayload.billAmount,
            accessKey: mockEarningCashbackPayload.accessKey,
        });
    });

    it('should return fallback earning cashback when surcharge API fails', async () => {
        (getSurcharge as Mock).mockRejectedValueOnce(new Error('Failed to fetch surcharge'));

        const { result } = renderHook(() => useSurchageApi());

        const cashback = await act(async () =>
            result.current.getEarningCashback(mockEarningCashbackPayload)
        );

        expect(cashback).toBe(100);
        expect(getSurcharge).toHaveBeenCalledWith({
            userId: mockId,
            userType: mockRole,
            amount: mockEarningCashbackPayload.billAmount,
            accessKey: mockEarningCashbackPayload.accessKey,
        });
    });

    it('should handle invalid amount input gracefully', async () => {
        const invalidPayload = {
            billAmount: -100,
            accessKey: 'testAccessKey',
        };

        const { result } = renderHook(() => useSurchageApi());

        const cashback = await act(async () => result.current.getEarningCashback(invalidPayload));

        expect(cashback).toBe(100);
    });
});

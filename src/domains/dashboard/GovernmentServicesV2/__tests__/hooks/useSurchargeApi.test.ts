import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import useSurchargeApi from '../../hooks/useSurchargeApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

const mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };

describe('useSurchargeApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((selector) => selector(mockState));
    });

    it('starts idle', () => {
        const { result } = renderHook(() => useSurchargeApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('calls getSurcharge with the gov services access key and returns numeric values', async () => {
        (getSurcharge as Mock).mockResolvedValue({ surcharge: '25.5', corporateCashback: '10' });
        const { result } = renderHook(() => useSurchargeApi());

        let res;
        await act(async () => {
            res = await result.current.getGovtServiceSurcharge(9500);
        });

        expect(getSurcharge).toHaveBeenCalledWith({
            userId: 1,
            userType: 'corporate',
            amount: 9500,
            accessKey: 'gov_services',
        });
        expect(res).toEqual({ surcharge: 25.5, corporateCashback: 10 });
        expect(result.current.isLoading).toBe(false);
    });

    it('returns zeros when getSurcharge returns false', async () => {
        (getSurcharge as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useSurchargeApi());

        let res;
        await act(async () => {
            res = await result.current.getGovtServiceSurcharge(100);
        });
        expect(res).toEqual({ surcharge: 0, corporateCashback: 0 });
    });

    it('coerces non-numeric / missing fields to 0', async () => {
        (getSurcharge as Mock).mockResolvedValue({ surcharge: 'abc' });
        const { result } = renderHook(() => useSurchargeApi());

        let res;
        await act(async () => {
            res = await result.current.getGovtServiceSurcharge(100);
        });
        expect(res).toEqual({ surcharge: 0, corporateCashback: 0 });
    });

    it('is loading while the request is in flight', async () => {
        let resolve: (v: unknown) => void = () => {};
        (getSurcharge as Mock).mockReturnValue(
            new Promise((r) => {
                resolve = r;
            })
        );
        const { result } = renderHook(() => useSurchargeApi());

        let pending: Promise<unknown> = Promise.resolve();
        act(() => {
            pending = result.current.getGovtServiceSurcharge(100);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ surcharge: 1, corporateCashback: 0 });
            await pending;
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('resets loading and rethrows if getSurcharge rejects', async () => {
        (getSurcharge as Mock).mockRejectedValue(new Error('boom'));
        const { result } = renderHook(() => useSurchargeApi());

        await act(async () => {
            await expect(result.current.getGovtServiceSurcharge(100)).rejects.toThrow('boom');
        });
        expect(result.current.isLoading).toBe(false);
    });
});

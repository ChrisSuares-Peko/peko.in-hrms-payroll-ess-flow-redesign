import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { SurchargeResponse } from '@customtypes/general';
import GetSurcharge from '@domains/dashboard/Hotels/hooks/useSurchargeApi';
import { getSurcharge } from '@src/services/surcharge';

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        auth: {
          role: 'user',
          id: '123',
        },
        hotels: {
          roomResponse: [
            { price: 100 },
            { price: 200 },
          ],
          netAmount: {
            totalFare: 300,
          },
        },
      },
    }),
}));


vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('GetSurcharge', () => {
   beforeEach(() => {
  vi.clearAllMocks();
});


    it('should fetch surcharge details and update state on success', async () => {
        const mockResponse: SurchargeResponse = {
            surcharge: '50',
            corporateCashback: '10',
        };

        (getSurcharge as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => GetSurcharge());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.surchargeData).toEqual(mockResponse);
    });

    it('should handle API failure and set surcharge details to undefined', async () => {
        (getSurcharge as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => GetSurcharge());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.surchargeData).toBeUndefined();
    });

    it('should set loading state correctly during API call', async () => {
        (getSurcharge as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => GetSurcharge());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.isLoading).toBe(false);
    });
});

import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import GetSurcharge from '../../hooks/useSurchargeApi';

vi.mock('@src/services/surcharge');
vi.mock('@src/hooks/store');

const mockGetSurcharge = getSurcharge as Mock;
const mockUseAppSelector = useAppSelector as Mock;

describe('GetSurcharge Hook', () => {
    const mockRole = 'admin';
    const mockUserId = '123';

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: mockRole, id: mockUserId });
    });

    it('should have initial state', () => {
        const { result } = renderHook(() => GetSurcharge());
        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should fetch surcharge data successfully', async () => {
        const mockResponse = { surcharge: 5, totalAmount: 105 };
        mockGetSurcharge.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => GetSurcharge());

        act(() => {
            result.current.getSurchargeData(100);
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.surchargeData).toEqual(mockResponse);
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should handle API failure gracefully', async () => {
        mockGetSurcharge.mockResolvedValueOnce(false);

        const { result } = renderHook(() => GetSurcharge());

        act(() => {
            result.current.getSurchargeData(100);
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.surchargeData).toBeUndefined();
            expect(result.current.isLoading).toBe(false);
        });
    });
});

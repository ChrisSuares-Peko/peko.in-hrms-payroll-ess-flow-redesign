import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { SurchargeResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import GetSurcharge from '../../hooks/useSurchargeApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('GetSurcharge Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Provide a default implementation for useAppSelector
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'user', id: '123' },
                    subscription: { amount: '100' },
                },
            })
        );
    });
    afterEach(() => {
        cleanup();
    });
    test('should initialize with undefined surchargeData and isLoading true', () => {
        const { result } = renderHook(() => GetSurcharge());

        // Check initial state
        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    test('should update surchargeData and set isLoading to false when getSurcharge returns data', async () => {
        const mockSurchargeData: SurchargeResponse = {
            surcharge: '20',
            corporateCashback: '10',
        };

        (getSurcharge as Mock).mockResolvedValue(mockSurchargeData);

        const { result } = renderHook(() => GetSurcharge());

        // Wait for useEffect to run and state to update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.surchargeData).toEqual(mockSurchargeData);
        expect(result.current.isLoading).toBe(false);
    });

    test('should set isLoading to false when getSurcharge returns false', async () => {
        // Mock the API response to return false
        (getSurcharge as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetSurcharge());

        // Wait for useEffect to run and state to update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Check that surchargeData is still undefined and isLoading is false
        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    test('should handle case where amount is 0 or undefined', async () => {
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'user', id: '123' },
                    subscription: { amount: '0' }, // or undefined
                },
            })
        );

        (getSurcharge as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    test('should call getSurchargeData only once per render', async () => {
        const mockSurchargeData: SurchargeResponse = {
            surcharge: '20',
            corporateCashback: '10',
        };

        (getSurcharge as Mock).mockResolvedValue(mockSurchargeData);

        renderHook(() => GetSurcharge());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(getSurcharge).toHaveBeenCalledTimes(1);
    });

    test('should clean up properly on unmount', async () => {
        const { result, unmount } = renderHook(() => GetSurcharge());

        unmount();

        // Since the component is unmounted, no state updates should occur.
        expect(result.current.surchargeData).toBeUndefined();
    });

    test('should handle errors from getSurcharge and set isLoading to false', async () => {
        (getSurcharge as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => GetSurcharge());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.surchargeData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});

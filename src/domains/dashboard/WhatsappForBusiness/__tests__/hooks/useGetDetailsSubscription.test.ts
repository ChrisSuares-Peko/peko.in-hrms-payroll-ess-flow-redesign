import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getPurchaseDetailsApi } from '../../api/index';
import { useGetDetailsSubscription } from '../../hooks/useGetDetailsSubscription';

vi.mock('../../api/index', () => ({
    getPurchaseDetailsApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGetDetailsSubscription Hook', () => {
    const mockSubscriptionDetails = {
        packageDetails: [
            { id: 'pkg1', name: 'Premium Package', price: 100 },
            { id: 'pkg2', name: 'Basic Package', price: 50 },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as true and details/packages as undefined', () => {
        const { result } = renderHook(() => useGetDetailsSubscription({ accessKey: 'key123' }));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(result.current.packages).toBeUndefined();
    });

    it('should fetch subscription details and update state', async () => {
        (getPurchaseDetailsApi as Mock).mockResolvedValue(mockSubscriptionDetails);

        const { result } = renderHook(() => useGetDetailsSubscription({ accessKey: 'key123' }));

        await act(async () => {
            await result.current.data; // Ensures API call completes
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockSubscriptionDetails.packageDetails[0]);
        expect(result.current.packages).toEqual(mockSubscriptionDetails.packageDetails);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (getPurchaseDetailsApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetDetailsSubscription({ accessKey: 'key123' }));

        await act(async () => {
            await result.current.data;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(result.current.packages).toBeUndefined();
    });

    it('should refetch data when accessKey changes', async () => {
        (getPurchaseDetailsApi as Mock).mockResolvedValue(mockSubscriptionDetails);

        const { result, rerender } = renderHook(
            ({ accessKey }) => useGetDetailsSubscription({ accessKey }),
            {
                initialProps: { accessKey: 'key123' },
            }
        );

        await act(async () => {
            await result.current.data;
        });

        expect(getPurchaseDetailsApi).toHaveBeenCalledTimes(1);

        rerender({ accessKey: 'key456' });

        await act(async () => {
            await result.current.data;
        });

        expect(getPurchaseDetailsApi).toHaveBeenCalledTimes(2);
    });
});

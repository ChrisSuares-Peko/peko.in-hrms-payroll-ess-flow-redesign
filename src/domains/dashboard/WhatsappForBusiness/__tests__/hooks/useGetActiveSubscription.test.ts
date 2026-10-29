import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { activeSubscriptionApi } from '../../api/index';
import { useGetActiveSubscription } from '../../hooks/useGetActiveSubscription';

vi.mock('../../api/index', () => ({
    activeSubscriptionApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGetActiveSubscription Hook', () => {
    const mockActiveSubscription = {
        id: 'sub123',
        plan: 'Premium',
        status: 'Active',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user123' });
    });

    it('should initialize with isLoading as true, data as null, and error as null', () => {
        const { result } = renderHook(() => useGetActiveSubscription());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('should fetch active subscription and update state', async () => {
        (activeSubscriptionApi as Mock).mockResolvedValue(mockActiveSubscription);

        const { result } = renderHook(() => useGetActiveSubscription());

        await act(async () => {
            await result.current.data;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual(mockActiveSubscription);
        expect(result.current.error).toBeNull();
    });

    it('should handle API failure and set error', async () => {
        (activeSubscriptionApi as Mock).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useGetActiveSubscription());

        await act(async () => {
            await result.current.data;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Failed to fetch active subscription');
    });

    it('should set error if API returns no data', async () => {
        (activeSubscriptionApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGetActiveSubscription());

        await act(async () => {
            await result.current.data;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('No active subscription found');
    });

    it('should refetch data when calling refresh', async () => {
        (activeSubscriptionApi as Mock).mockResolvedValue(mockActiveSubscription);

        const { result } = renderHook(() => useGetActiveSubscription());

        await act(async () => {
            await result.current.data;
        });

        expect(activeSubscriptionApi).toHaveBeenCalledTimes(1);

        await act(async () => {
            result.current.refresh();
        });

        expect(activeSubscriptionApi).toHaveBeenCalledTimes(2);
    });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { subscriptionListing } from '../../api/index';
import { useGetSubscription } from '../../hooks/useGetSubscription';

// ✅ Mock API call
vi.mock('../../api/index', () => ({
    subscriptionListing: vi.fn(),
}));

describe('useGetSubscription Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and update subscription list successfully', async () => {
        const mockSubscriptionData = {
            subscription: [
                { id: 1, name: 'Premium Plan', price: 1000 },
                { id: 2, name: 'Basic Plan', price: 500 },
            ],
        };

        (subscriptionListing as any).mockResolvedValue(mockSubscriptionData);

        const { result } = renderHook(() => useGetSubscription());

        expect(result.current.subscriptionLoader).toBe(true);

        await act(async () => {
            await result.current.subscription;
        });

        expect(result.current.subscription).toEqual(mockSubscriptionData.subscription);
        expect(result.current.subscriptionLoader).toBe(false);
        expect(subscriptionListing).toHaveBeenCalledTimes(1);
    });

    it('should handle API failure gracefully', async () => {
        (subscriptionListing as any).mockResolvedValue(false);

        const { result } = renderHook(() => useGetSubscription());

        await act(async () => {
            await result.current.subscription;
        });

        expect(result.current.subscription).toEqual([]);
        expect(result.current.subscriptionLoader).toBe(false);
    });
});

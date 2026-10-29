import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { planDetailsApi } from '../../api/planDetailsApi';
import { usePlanDetailsApi } from '../../hooks/usePlanDetailsApi';

// Mock dependencies
vi.mock('../../api/planDetailsApi', () => ({
    planDetailsApi: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('usePlanDetailsApi hook', () => {
    const mockPlanDetails = {
        id: 'plan123',
        name: 'Premium Plan',
        description: 'A comprehensive business plan',
        price: 4999,
        billingCycle: 'monthly',
        features: ['Feature A', 'Feature B'],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ id: 'user123', role: 'admin' });
    });

    it('should start with loading state', () => {
        const { result } = renderHook(() => usePlanDetailsApi('plan123'));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('should fetch plan details and update state on success', async () => {
        (planDetailsApi as Mock).mockResolvedValue(mockPlanDetails);

        const { result } = renderHook(() => usePlanDetailsApi('plan123'));

        await act(async () => {
            await result.current;
        });

        expect(planDetailsApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            planId: 'plan123',
        });

        expect(result.current.data).toEqual(mockPlanDetails);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure and set isLoading to false', async () => {
        (planDetailsApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => usePlanDetailsApi('plan123'));

        await act(async () => {
            await result.current;
        });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle an empty API response gracefully', async () => {
        (planDetailsApi as Mock).mockResolvedValue({});

        const { result } = renderHook(() => usePlanDetailsApi('plan123'));

        await act(async () => {
            await result.current;
        });

        expect(result.current.data).toEqual({});
        expect(result.current.isLoading).toBe(false);
    });
});

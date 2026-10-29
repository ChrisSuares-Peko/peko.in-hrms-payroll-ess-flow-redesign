import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllPlans, getPlan } from '../../api/index';
import usePlansApi from '../../hooks/usePlansApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getAllPlans: vi.fn(),
    getPlan: vi.fn(),
}));

describe('usePlansApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useAppSelector as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                },
            })
        );
    });

    it('fetches and sets plans list correctly', async () => {
        const mockResponse = {
            data: [
                {
                    id: 1,
                    name: 'Basic Plan',
                    price: 1000,
                },
                {
                    id: 2,
                    name: 'Premium Plan',
                    price: 2000,
                },
            ],
        };

        (getAllPlans as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => usePlansApi({ initialLoading: true }));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(getAllPlans).toHaveBeenCalledWith({ userId: 1, userType: 'user' });

        expect(result.current.plans).toEqual(mockResponse);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles failed API response gracefully', async () => {
        (getAllPlans as any).mockResolvedValue(false);

        const { result } = renderHook(() => usePlansApi({ initialLoading: true }));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {});

        expect(result.current.plans).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it('fetches a plan by ID correctly', async () => {
        const mockPlan = {
            id: 2,
            name: 'Premium Plan',
            price: 2000,
        };

        (getPlan as any).mockResolvedValue(mockPlan);

        const { result } = renderHook(() => usePlansApi({ initialLoading: false }));

        expect(result.current.isLoading).toBe(true);

        let planData;
        await act(async () => {
            planData = await result.current.getPlanById(2);
        });

        expect(getPlan).toHaveBeenCalledWith({ userId: 1, userType: 'user' }, 2);
        expect(planData).toEqual(mockPlan);
        expect(result.current.isLoading).toBe(false);
    });

    it('returns undefined if fetching plan by ID fails', async () => {
        (getPlan as any).mockResolvedValue(false);

        const { result } = renderHook(() => usePlansApi({ initialLoading: false }));

        expect(result.current.isLoading).toBe(true);

        let planData;
        await act(async () => {
            planData = await result.current.getPlanById(3);
        });

        expect(getPlan).toHaveBeenCalledWith({ userId: 1, userType: 'user' }, 3);
        expect(planData).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});

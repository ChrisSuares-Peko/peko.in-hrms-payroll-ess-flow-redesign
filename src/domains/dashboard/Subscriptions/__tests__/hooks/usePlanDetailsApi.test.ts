import { renderHook, waitFor } from '@testing-library/react';
import { describe, beforeEach, test, vi, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getPlanDetails } from '../../api/index';
import GetPlanDetails from '../../hooks/usePlanDetailsApi';
// import { userDetailsResponse } from '../../types/types';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getPlanDetails: vi.fn(),
}));

describe('get plan details Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock implementation for useAppSelector
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'user', id: '123' },
                },
            })
        );
    });

    test('should fetch and set plan details successfully', async () => {
        const mockPlanDetailsResponse = {
            planDatas: [
                {
                    id: '1',
                    name: 'Basic Plan',
                    validity: '1 Year',
                    price: '₹ 100',
                    subscriptionType: 'Monthly',
                    features: 'Feature 1, Feature 2',
                    noOfUsers: 5,
                },
            ],
        };

        (getPlanDetails as Mock).mockResolvedValue(mockPlanDetailsResponse);

        const { result } = renderHook(() => GetPlanDetails('sub-123'));

        await waitFor(() => expect(result.current.planLoader).toBe(false));

        expect(result.current.planData).toEqual([
            {
                id: '1',
                title: 'Basic Plan',
                period: '1 Year',
                amount: '₹ 100',
                monthlyCost: 'Monthly',
                features: 'Feature 1, Feature 2',
                noOfUsers: 5,
            },
        ]);
    });
    test('should handle empty plan details response', async () => {
        const mockPlanDetailsResponse = { planDatas: [] };

        (getPlanDetails as Mock).mockResolvedValue(mockPlanDetailsResponse);

        const { result } = renderHook(() => GetPlanDetails('sub-123'));

        await waitFor(() => expect(result.current.planLoader).toBe(false));

        expect(result.current.planData).toEqual([]);
    });

    test('should handle API failure', async () => {
        (getPlanDetails as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetPlanDetails('sub-123'));

        await waitFor(() => expect(result.current.planLoader).toBe(false));

        expect(result.current.planData).toBeUndefined();
    });
    test('should set loader to true initially and false after data is fetched', async () => {
        const mockPlanDetailsResponse = {
            planDatas: [
                {
                    id: '1',
                    name: 'Basic Plan',
                    validity: '1 Year',
                    price: '₹ 100',
                    subscriptionType: 'Monthly',
                    features: 'Feature 1, Feature 2',
                    noOfUsers: 5,
                },
            ],
        };

        (getPlanDetails as Mock).mockResolvedValue(mockPlanDetailsResponse);

        const { result } = renderHook(() => GetPlanDetails('sub-123'));

        expect(result.current.planLoader).toBe(true);

        await waitFor(() => expect(result.current.planLoader).toBe(false));
    });
});

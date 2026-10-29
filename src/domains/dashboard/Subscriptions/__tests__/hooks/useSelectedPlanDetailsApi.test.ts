import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSingleSelectedPlanDetails } from '../../api/index';
import GetSingleSelectedPlanDetails from '../../hooks/useSelectedPlanDetailsApi';
import { SelectedPlanDetailsResponse } from '../../types/types';

// Mock modules
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getSingleSelectedPlanDetails: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('GetSingleSelectedPlanDetails', () => {
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

    test('should fetch and set plan details correctly', async () => {
        const mockResponse: SelectedPlanDetailsResponse = {
            data: {
                name: 'Test Plan',
                features: 'A test plan',
                price: '100',
                noOfUsers: 0,
                software: {
                    id: 0,
                    name: '',
                },
            },
        };
        (getSingleSelectedPlanDetails as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => GetSingleSelectedPlanDetails('plan1'));

        // Wait for hook to finish loading
        await act(async () => {
            await result.current.isLoading;
        });

        expect(result.current.data).toEqual(mockResponse);
        expect(result.current.isLoading).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('should navigate and show toast on failure', async () => {
        (getSingleSelectedPlanDetails as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetSingleSelectedPlanDetails('plan1'));

        // Wait for hook to finish loading
        await act(async () => {
            await result.current.isLoading;
        });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(mockNavigate).toHaveBeenCalledWith('/softwares');
        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description: 'Product not found',
                variant: 'error',
            })
        );
    });

    test('should initialize with loading state', () => {
        const { result } = renderHook(() => GetSingleSelectedPlanDetails('plan1'));

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});

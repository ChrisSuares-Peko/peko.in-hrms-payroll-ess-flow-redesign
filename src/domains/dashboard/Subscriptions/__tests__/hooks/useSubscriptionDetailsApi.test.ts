import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSingleSubscriptionDetails } from '../../api/index';
import GetSingleSubscriptionDetails from '../../hooks/useSubscriptionDetailsApi';
import { SubscriptionDetailsResponse } from '../../types/types';

// Mock modules
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    getSingleSubscriptionDetails: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

describe('GetSingleSubscriptionDetails', () => {
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

    test('should fetch and set subscription details correctly', async () => {
        const mockResponse: SubscriptionDetailsResponse = {
            data: {
                id: 1,
                name: 'Test Subscription',
                description: 'A test subscription',
                discount: '100',
                highlights: '',
                productImage: '',
                features: '',
                image: '',
                typeOfOrder: '',
            },
        };
        (getSingleSubscriptionDetails as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => GetSingleSubscriptionDetails('sub1'));

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
        (getSingleSubscriptionDetails as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => GetSingleSubscriptionDetails('sub1'));

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
        const { result } = renderHook(() => GetSingleSubscriptionDetails('sub1'));

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getSubscriptions } from '../../api/index';
import useSubscriptionApi from '../../hooks/useSubscriptionApi';
import { SubscriptionListResponse } from '../../types/types';

// Mocking dependencies
vi.mock('../../api/index', () => ({
    getSubscriptions: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useSubscriptionApi', () => {
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

    test('should return data and update state on successful fetch', async () => {
        const mockResponse: SubscriptionListResponse = {
            data: [
                {
                    id: 1,
                    name: 'Subscription A',
                    description: 'Description A',
                    image: 'imageA.jpg',
                    discount: '10.00',
                    brand: null,
                    highlights: '',
                    SKUCode: null,
                    productImage: '',
                    price: '',
                    quantity: 0,
                    status: false,
                    discountType: '',
                    actualPrice: null,
                    GST: '',
                    gstType: '',
                    vendors: null,
                    warranty: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    categoryId: 0,
                    category: {
                        id: 0,
                        categoryName: '',
                    },
                },
                // Add more mock subscription data if needed
            ],
            recordsTotal: 1,
        };

        (getSubscriptions as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useSubscriptionApi('', 1, '', 10, null));

        // Initially loading state
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            // Wait for the hook to complete the fetch
            await new Promise(setImmediate);
        });

        expect(getSubscriptions).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            searchText: '',
            page: 1,
            category: '',
            length: 10,
            selectedCategory: null,
        });

        expect(result.current.data).toEqual([
            {
                id: 1,
                name: 'Subscription A',
                description: 'Description A',
                image: 'imageA.jpg',
                badge: '10.00',
            },
        ]);
        expect(result.current.count).toBe(1);
        expect(result.current.isLoading).toBe(false);
    });

    test('should handle failed fetch gracefully', async () => {
        (getSubscriptions as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useSubscriptionApi('', 1, '', 10, null));

        // Initially loading state
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            // Wait for the hook to complete the fetch
            await new Promise(setImmediate);
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    test('should set loading state correctly', async () => {
        // Mock the API call to return data
        (getSubscriptions as Mock).mockResolvedValue({
            data: [],
            recordsTotal: 0,
        });

        const { result } = renderHook(() => useSubscriptionApi('', 1, '', 10, null));

        // Check initial loading state
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            // Wait for the hook to complete the fetch
            await new Promise(setImmediate);
        });

        // Check loading state after fetch
        expect(result.current.isLoading).toBe(false);
    });

    test('should call getSubscriptionList with correct parameters when dependencies change', async () => {
        const mockResponse: SubscriptionListResponse = {
            data: [],
            recordsTotal: 0,
        };

        (getSubscriptions as Mock).mockResolvedValue(mockResponse);

        const { rerender } = renderHook(
            ({ searchText, page, category, length, selectedCategory }) =>
                useSubscriptionApi(searchText, page, category, length, selectedCategory),
            {
                initialProps: {
                    searchText: '',
                    page: 1,
                    category: '',
                    length: 10,
                    selectedCategory: null,
                },
            }
        );

        await act(async () => {
            await new Promise(setImmediate);
        });

        expect(getSubscriptions).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            searchText: '',
            page: 1,
            category: '',
            length: 10,
            selectedCategory: null,
        });

        rerender({
            searchText: 'newSearch',
            page: 2,
            category: 'newCategory',
            length: 20,
            selectedCategory: null,
        });

        await act(async () => {
            await new Promise(setImmediate);
        });

        expect(getSubscriptions).toHaveBeenCalledWith({
            userId: '123',
            userType: 'user',
            searchText: 'newSearch',
            page: 2,
            category: 'newCategory',
            length: 20,
            selectedCategory: null,
        });
    });
});

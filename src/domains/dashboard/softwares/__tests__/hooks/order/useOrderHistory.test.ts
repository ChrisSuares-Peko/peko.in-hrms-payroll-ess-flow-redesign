/**
 * @file useOrderHistory.test.ts
 * @description Unit tests for useOrderHistory hook.
 *
 * Test coverage:
 *  - Initial state values are correct
 *  - fetchOrderDetails is called on mount with correct payload
 *  - Sets orderDetails and total from API response
 *  - isLoading is true during fetch and false after
 *  - Does not set orderDetails when API returns falsy
 *  - handleFilterChange updates from/to and resets page to 1
 *  - handleFilterChange with null clears from and resets page
 *  - handleSearchChange updates searchInput and debounces filter update
 *  - handlePagination updates page and limit
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useOrderHistory from '../../../hooks/order/useOrderHistory';
import { IPurchaseItem } from '../../../types/product';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchOrderDetails = vi.fn();
vi.mock('../../../api', () => ({
    fetchOrderDetails: (...args: unknown[]) => mockFetchOrderDetails(...args),
}));

const mockScrollTotop = vi.fn();
vi.mock('../../../utils/scrollTotop', () => ({
    default: () => mockScrollTotop(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPurchaseItems: IPurchaseItem[] = [
    {
        key: 'key-1',
        purchasedOn: '2025-01-15',
        productName: 'Slack',
        planName: 'Pro',
        orderId: 'order-1',
        paymentMode: 'card',
        totalAmount: '100',
        status: 'PURCHASED',
    },
    {
        key: 'key-2',
        purchasedOn: '2025-02-10',
        productName: 'Zoom',
        planName: 'Basic',
        orderId: 'order-2',
        paymentMode: 'cash',
        totalAmount: '50',
        status: 'PENDING',
    },
];

// ---------------------------------------------------------------------------
// Store / wrapper factory
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({
                auth: { id: 42, role: 'buyer' },
            }),
        },
    });

const makeWrapper = () => {
    const store = buildStore();
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store } as any, children);
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrderHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Initial state
    // -------------------------------------------------------------------------

    /**
     * @test Initial state has empty orderDetails, total=0, and correct filter defaults.
     */
    it('initialises with empty orderDetails, total 0, and correct filter defaults', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        expect(result.current.orderDetails).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.searchInput).toBe('');
        expect(result.current.filter.page).toBe(1);
        expect(result.current.filter.limit).toBe(10);
        expect(result.current.filter.search).toBe('');
    });

    // -------------------------------------------------------------------------
    // fetchOrderDetails on mount
    // -------------------------------------------------------------------------

    /**
     * @test Calls fetchOrderDetails with the correct payload on mount.
     */
    it('calls fetchOrderDetails on mount with userId, userType, and filter values', async () => {
        mockFetchOrderDetails.mockResolvedValue({
            data: { orderDetails: mockPurchaseItems, totalData: 2 },
        });

        renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(mockFetchOrderDetails).toHaveBeenCalledTimes(1));

        const payload = mockFetchOrderDetails.mock.calls[0][0];
        expect(payload).toMatchObject({
            userId: 42,
            userType: 'buyer',
            searchText: '',
            page: 1,
            limit: 10,
        });
        expect(payload.from).toBeTruthy();
        expect(payload.to).toBeTruthy();
    });

    /**
     * @test Sets orderDetails and total from a successful API response.
     */
    it('sets orderDetails and total from API response', async () => {
        mockFetchOrderDetails.mockResolvedValue({
            data: { orderDetails: mockPurchaseItems, totalData: 2 },
        });

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.orderDetails).toEqual(mockPurchaseItems);
        expect(result.current.total).toBe(2);
    });

    /**
     * @test isLoading is true during fetch and false after.
     */
    it('sets isLoading=true during fetch and false after', async () => {
        let resolveApi!: (value: unknown) => void;
        mockFetchOrderDetails.mockReturnValueOnce(
            new Promise(res => {
                resolveApi = res;
            })
        );

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolveApi({ data: { orderDetails: mockPurchaseItems, totalData: 2 } });
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    /**
     * @test Does not update orderDetails when API returns falsy.
     */
    it('leaves orderDetails empty when fetchOrderDetails returns falsy', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.orderDetails).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    // -------------------------------------------------------------------------
    // handleFilterChange
    // -------------------------------------------------------------------------

    /**
     * @test handleFilterChange updates from/to and resets page to 1.
     */
    it('handleFilterChange updates from and to and resets page to 1', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newFrom = dayjs('2025-03-01');
        const newTo = dayjs('2025-03-31');

        act(() => {
            result.current.handleFilterChange([newFrom, newTo]);
        });

        expect(result.current.filter.from?.isSame(newFrom, 'day')).toBe(true);
        expect(result.current.filter.to?.isSame(newTo, 'day')).toBe(true);
        expect(result.current.filter.page).toBe(1);
    });

    /**
     * @test handleFilterChange with null clears from, sets to=today, and resets page.
     */
    it('handleFilterChange with null clears from and resets page', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handleFilterChange(null);
        });

        expect(result.current.filter.from).toBeNull();
        expect(result.current.filter.to).not.toBeNull();
        expect(result.current.filter.page).toBe(1);
    });

    // -------------------------------------------------------------------------
    // handleSearchChange
    // -------------------------------------------------------------------------

    /**
     * @test handleSearchChange updates searchInput immediately.
     */
    it('handleSearchChange updates searchInput immediately', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const event = { target: { value: 'Slack' } } as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleSearchChange(event);
        });

        expect(result.current.searchInput).toBe('Slack');
    });

    /**
     * @test handleSearchChange debounces filter.search update by 400 ms.
     */
    it('debounces filter.search update by 400 ms', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        vi.useFakeTimers();
        try {
            const event = { target: { value: 'Zoom' } } as React.ChangeEvent<HTMLInputElement>;

            act(() => {
                result.current.handleSearchChange(event);
            });

            expect(result.current.filter.search).toBe('');

            act(() => {
                vi.advanceTimersByTime(400);
            });

            expect(result.current.filter.search).toBe('Zoom');
            expect(result.current.filter.page).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });

    /**
     * @test handleSearchChange strips emoji characters from input.
     */
    it('strips emoji characters from the search input', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const event = {
            target: { value: 'Slack 😀' },
        } as React.ChangeEvent<HTMLInputElement>;

        act(() => {
            result.current.handleSearchChange(event);
        });

        expect(result.current.searchInput).not.toContain('😀');
    });

    // -------------------------------------------------------------------------
    // handlePagination
    // -------------------------------------------------------------------------

    /**
     * @test handlePagination updates page and limit and calls scrollTotop.
     */
    it('handlePagination updates page and limit and scrolls to top', async () => {
        mockFetchOrderDetails.mockResolvedValue(false);

        const { result } = renderHook(() => useOrderHistory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handlePagination(3, 20);
        });

        expect(result.current.filter.page).toBe(3);
        expect(result.current.filter.limit).toBe(20);
        expect(mockScrollTotop).toHaveBeenCalledTimes(1);
    });
});

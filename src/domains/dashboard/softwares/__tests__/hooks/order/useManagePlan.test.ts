/**
 * @file useManagePlan.test.ts
 * @description Unit tests for useManagePlan hook.
 *
 * Test coverage:
 *  - Navigates back when orderId param is absent
 *  - Fetches order on mount when orderId is present
 *  - Sets order state from API response
 *  - Sets isFetching=true during fetch and false after
 *  - Does not set order when fetchOneOrder returns false
 *  - handleCancelPlan is a no-op when order is null
 *  - handleCancelPlan calls cancelPlan with correct payload
 *  - handleCancelPlan updates order status to 'Cancelled' on success
 *  - handleCancelPlan dispatches success toast on success
 *  - handleCancelPlan sets isLoading=true during call and false after
 *  - handleCancelPlan does not update order when cancelPlan returns false
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useManagePlan from '../../../hooks/order/useManagePlan';
import { ISubscriptionPlan } from '../../../types/product';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
    const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
    return {
        ...actual,
        useDispatch: () => mockDispatch,
    };
});

const mockFetchOneOrder = vi.fn();
const mockCancelPlan = vi.fn();
vi.mock('../../../api', () => ({
    fetchOneOrder: (...args: unknown[]) => mockFetchOneOrder(...args),
    cancelPlan: (...args: unknown[]) => mockCancelPlan(...args),
}));

const mockShowToast = vi.fn((payload: unknown) => ({ type: 'api/showToast', payload }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: unknown) => mockShowToast(payload),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockOrder: ISubscriptionPlan = {
    billingCycle: 'monthly',
    order: { amountInINR: '100', paymentMode: 'card' },
    productName: 'Slack',
    purchaseType: 'subscription',
    status: 'Active',
    subscriptionEndDate: '2025-12-31',
    subscriptionStartDate: '2025-01-01',
    isCancelled: false,
};

// ---------------------------------------------------------------------------
// Store / wrapper factories
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({
                auth: { id: 'user-1', role: 'buyer' },
            }),
        },
    });

/**
 * Wraps the hook inside a route that supplies :orderId param.
 * Pass undefined to simulate a route with no orderId.
 */
const makeWrapper = (orderId?: string) => {
    const store = buildStore();
    const path = orderId ? `/manage-plan/${orderId}` : '/manage-plan';
    const routePattern = orderId ? '/manage-plan/:orderId' : '/manage-plan';

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
            Provider,
            { store } as any,
            React.createElement(
                MemoryRouter,
                { initialEntries: [path] },
                React.createElement(
                    Routes,
                    null,
                    React.createElement(Route, { path: routePattern, element: children })
                )
            )
        );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useManagePlan', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // orderId absent
    // -------------------------------------------------------------------------

    /**
     * @test Navigates back when orderId param is absent.
     */
    it('navigates back when orderId is not in the route', async () => {
        renderHook(() => useManagePlan(), { wrapper: makeWrapper(undefined) });

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(-1));
        expect(mockFetchOneOrder).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // fetchOneOrder on mount
    // -------------------------------------------------------------------------

    /**
     * @test Calls fetchOneOrder with correct payload on mount.
     */
    it('fetches order on mount with userId, userType, and orderId', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });

        renderHook(() => useManagePlan(), { wrapper: makeWrapper('order-123') });

        await waitFor(() =>
            expect(mockFetchOneOrder).toHaveBeenCalledWith({
                userId: 'user-1',
                userType: 'buyer',
                orderId: 'order-123',
            })
        );
    });

    /**
     * @test Sets order state from fetchOneOrder response.
     */
    it('sets order from API response', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));
    });

    /**
     * @test isFetching is true during fetch and false after.
     */
    it('sets isFetching=true during fetch and false after', async () => {
        let resolveApi!: (value: unknown) => void;
        mockFetchOneOrder.mockReturnValueOnce(
            new Promise(res => {
                resolveApi = res;
            })
        );

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.isFetching).toBe(true));

        resolveApi({ orderDetails: mockOrder });

        await waitFor(() => expect(result.current.isFetching).toBe(false));
    });

    /**
     * @test Does not set order when fetchOneOrder returns false.
     */
    it('does not set order when fetchOneOrder returns false', async () => {
        mockFetchOneOrder.mockResolvedValue(false);

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.isFetching).toBe(false));
        expect(result.current.order).toBeNull();
    });

    // -------------------------------------------------------------------------
    // handleCancelPlan
    // -------------------------------------------------------------------------

    /**
     * @test handleCancelPlan is a no-op when order is null.
     */
    it('handleCancelPlan does nothing when order is null', async () => {
        mockFetchOneOrder.mockResolvedValue(false);

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.isFetching).toBe(false));

        await act(async () => {
            await result.current.handleCancelPlan();
        });

        expect(mockCancelPlan).not.toHaveBeenCalled();
    });

    /**
     * @test handleCancelPlan calls cancelPlan with correct payload.
     */
    it('calls cancelPlan with userId, userType, and orderId', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });
        mockCancelPlan.mockResolvedValue({ status: true });

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));

        await act(async () => {
            await result.current.handleCancelPlan();
        });

        expect(mockCancelPlan).toHaveBeenCalledWith({
            userId: 'user-1',
            userType: 'buyer',
            orderId: 'order-123',
        });
    });

    /**
     * @test Updates order status to 'Cancelled' on successful cancelPlan.
     */
    it('updates order status to Cancelled on success', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });
        mockCancelPlan.mockResolvedValue({ status: true });

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));

        await act(async () => {
            await result.current.handleCancelPlan();
        });

        expect(result.current.order?.status).toBe('Cancelled');
    });

    /**
     * @test Dispatches success toast after successful cancellation.
     */
    it('dispatches success toast when cancelPlan succeeds', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });
        mockCancelPlan.mockResolvedValue({ status: true });

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));

        await act(async () => {
            await result.current.handleCancelPlan();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'api/showToast',
                payload: expect.objectContaining({ variant: 'success' }),
            })
        );
    });

    /**
     * @test isLoading transitions true → false around handleCancelPlan.
     */
    it('sets isLoading=true during handleCancelPlan and false after', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });

        let resolveCancel!: (value: unknown) => void;
        mockCancelPlan.mockReturnValueOnce(
            new Promise(res => {
                resolveCancel = res;
            })
        );

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));

        act(() => {
            result.current.handleCancelPlan();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(true));

        await act(async () => {
            resolveCancel({ status: true });
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    /**
     * @test Does not update order when cancelPlan returns false.
     */
    it('does not update order status when cancelPlan returns false', async () => {
        mockFetchOneOrder.mockResolvedValue({ orderDetails: mockOrder });
        mockCancelPlan.mockResolvedValue(false);

        const { result } = renderHook(() => useManagePlan(), {
            wrapper: makeWrapper('order-123'),
        });

        await waitFor(() => expect(result.current.order).toEqual(mockOrder));

        await act(async () => {
            await result.current.handleCancelPlan();
        });

        expect(result.current.order?.status).toBe('Active');
        expect(mockShowToast).not.toHaveBeenCalled();
    });
});

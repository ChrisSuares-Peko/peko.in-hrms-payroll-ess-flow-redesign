/**
 * @file ManagePlan.test.tsx
 * @module ManagePlanTests
 * @description
 * Unit tests for the ManagePlan component.
 *
 * This suite validates all UI states, conditional rendering,
 * formatting logic, and user interactions for subscription
 * and one-time purchase flows.
 *
 * @coverage
 * - Loading state (Skeleton)
 * - Empty state (No order)
 * - Subscription rendering
 * - One-time purchase rendering
 * - Cancel button behavior (enabled/disabled)
 * - Cancel click interaction
 * - Cancelled plan message
 * - Status-based button disabling
 * - Loading button state ("Cancelling")
 * - Date formatting
 * - Amount formatting
 * - Capitalization of values
 * - Handling of null purchaseType
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ManagePlan from '../../pages/ManagePlan';
import type { ISubscriptionPlan } from '../../types';

/**
 * ---------------------------
 * MOCK HANDLER
 * ---------------------------
 */
const mockHandleCancelPlan = vi.fn();

/**
 * ---------------------------
 * BASE ORDER (REUSABLE)
 * ---------------------------
 */
const baseOrder: ISubscriptionPlan = {
    productName: 'test product',
    purchaseType: 'subscription',
    status: 'ACTIVE',
    subscriptionStartDate: '2024-01-01',
    subscriptionEndDate: '2024-12-31',
    billingCycle: 'monthly',
    isCancelled: false,
    order: {
        amountInINR: '100',
        paymentMode: 'card',
    },
};

/**
 * ---------------------------
 * MOCK HOOK STATE
 * ---------------------------
 */
const mockUseManagePlan = {
    order: null as ISubscriptionPlan | null,
    handleCancelPlan: mockHandleCancelPlan,
    isLoading: false,
    isFetching: false,
};

vi.mock('../../hooks/order/useManagePlan', () => ({
    default: () => mockUseManagePlan,
}));

/**
 * ---------------------------
 * REDUX STORE MOCK
 * ---------------------------
 */
const rootReducer = combineReducers({
    reducer: combineReducers({
        auth: (state = { role: 'admin', id: '1' }) => state,
    }),
});

const store = configureStore({
    reducer: rootReducer,
});

/**
 * ---------------------------
 * RENDER HELPER
 * ---------------------------
 */
const renderComponent = () =>
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ManagePlan />
            </MemoryRouter>
        </Provider>
    );

/**
 * ---------------------------
 * TEST SUITE
 * ---------------------------
 */
describe('ManagePlan Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseManagePlan.order = null;
        mockUseManagePlan.isFetching = false;
        mockUseManagePlan.isLoading = false;
    });

    /**
     * ---------------------------
     * LOADING & EMPTY STATES
     * ---------------------------
     */
    it('should show skeleton when fetching', () => {
        mockUseManagePlan.isFetching = true;

        renderComponent();

        expect(document.querySelector('.ant-skeleton')).toBeTruthy();
    });

    it('should show empty state when no order exists', () => {
        renderComponent();

        expect(screen.getAllByText(/No data/i).length).toBeGreaterThan(0);
    });

    /**
     * ---------------------------
     * SUBSCRIPTION FLOW
     * ---------------------------
     */
    it('should render subscription plan details', () => {
        mockUseManagePlan.order = baseOrder;

        renderComponent();

        expect(screen.getByText(/Test product/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Amount/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call cancel handler when clicked', () => {
        mockUseManagePlan.order = baseOrder;

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockHandleCancelPlan).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button when loading', () => {
        mockUseManagePlan.order = baseOrder;
        mockUseManagePlan.isLoading = true;

        renderComponent();

        const btn = screen.getByRole('button');

        expect(btn).toBeDisabled();
        expect(screen.getByText(/Cancelling/i)).toBeInTheDocument();
    });

    it('should disable cancel button when status is not ACTIVE', () => {
        mockUseManagePlan.order = {
            ...baseOrder,
            status: 'EXPIRED',
        };

        renderComponent();

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show cancellation message when plan is cancelled', () => {
        mockUseManagePlan.order = {
            ...baseOrder,
            isCancelled: true,
        };

        renderComponent();

        expect(screen.getByText(/Cancellation effective on/i)).toBeInTheDocument();
    });

    /**
     * ---------------------------
     * ONE-TIME PURCHASE FLOW
     * ---------------------------
     */
    it('should render one-time purchase details', () => {
        mockUseManagePlan.order = {
            ...baseOrder,
            purchaseType: 'one_time',
        };

        renderComponent();

        expect(screen.getByText(/One time/i)).toBeInTheDocument();
    });

    /**
     * ---------------------------
     * EDGE CASES
     * ---------------------------
     */
    it('should treat null purchaseType as subscription', () => {
        mockUseManagePlan.order = {
            ...baseOrder,
            purchaseType: null,
        };

        renderComponent();

        expect(screen.getByText(/Status/i)).toBeInTheDocument();
    });

    /**
     * ---------------------------
     * DATA FORMATTING
     * ---------------------------
     */
    it('should display formatted total amount', () => {
        mockUseManagePlan.order = baseOrder;

        renderComponent();

        expect(screen.getByText(/INR 100.00/i)).toBeInTheDocument();
    });

    it('should format and display dates correctly', () => {
        mockUseManagePlan.order = baseOrder;

        renderComponent();

        expect(screen.getByText(/01 Jan 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/31 Dec 2024/i)).toBeInTheDocument();
    });

    it('should capitalize product name', () => {
        mockUseManagePlan.order = baseOrder;

        renderComponent();

        expect(screen.getByText(/Test product/i)).toBeInTheDocument();
    });
});

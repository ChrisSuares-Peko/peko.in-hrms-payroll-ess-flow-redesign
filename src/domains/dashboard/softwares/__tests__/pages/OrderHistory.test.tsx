/**
 * @file OrderHistory.test.tsx
 * @module PurchaseTablePageTests
 * @description
 * Comprehensive unit tests for the PurchaseTable (OrderHistory) page component.
 *
 * This suite validates:
 * - UI rendering (Header + OrderTable)
 * - Data flow from hook → child components
 * - State handling (loading, empty, populated)
 * - User interactions (search, filter, pagination)
 *
 * @remarks
 * - Child components are mocked to isolate page-level logic.
 * - useOrderHistory hook is mocked to control state deterministically.
 * - Focus is on verifying correct data propagation and behavior.
 *
 * @coverage
 * - Verifies rendering of Header and OrderTable
 * - Validates props passed to child components
 * - Ensures correct handling of:
 *   - Loading state
 *   - Empty state
 *   - Data state
 * - Confirms event handlers are triggered correctly
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PurchaseTable from '../../pages/OrderHistory';
import type { IPurchaseItem } from '../../types';

/**
 * =========================================================
 * MOCK HANDLERS
 * =========================================================
 */
const mockHandleFilterChange = vi.fn();
const mockHandleSearchChange = vi.fn();
const mockHandlePagination = vi.fn();

/**
 * =========================================================
 * MOCK HOOK STATE
 * =========================================================
 */
const mockUseOrderHistory: {
    isLoading: boolean;
    orderDetails: IPurchaseItem[];
    handleFilterChange: ReturnType<typeof vi.fn>;
    handleSearchChange: ReturnType<typeof vi.fn>;
    handlePagination: ReturnType<typeof vi.fn>;
    filter: string;
    searchInput: string;
    total: number;
} = {
    isLoading: false,
    orderDetails: [],
    handleFilterChange: mockHandleFilterChange,
    handleSearchChange: mockHandleSearchChange,
    handlePagination: mockHandlePagination,
    filter: 'all',
    searchInput: '',
    total: 0,
};

vi.mock('../../hooks/order/useOrderHistory', () => ({
    default: () => mockUseOrderHistory,
}));

/**
 * =========================================================
 * MOCK CHILD COMPONENTS
 * =========================================================
 */
vi.mock('../../components/orderHistory', () => ({
    Header: ({ handleSearchChange, handleFilterChange, filter, searchInput }: any) => (
        <div data-testid="header">
            <span data-testid="header-filter">{filter}</span>
            <span data-testid="header-search">{searchInput}</span>

            <input
                placeholder="search"
                data-testid="search-input"
                onChange={e => handleSearchChange(e.target.value)}
            />

            <button
                type="button"
                data-testid="filter-btn"
                onClick={() => handleFilterChange('active')}
            >
                filter
            </button>
        </div>
    ),

    OrderTable: ({ isLoading, orderDetails, handlePagination, total }: any) => (
        <div data-testid="table">
            <span data-testid="table-total">{total}</span>

            {isLoading && <p data-testid="loading">loading</p>}

            {!isLoading && orderDetails.length === 0 && <p data-testid="empty">No data</p>}

            {!isLoading &&
                orderDetails.map((item: any) => (
                    <div key={item.key} data-testid="row">
                        {item.productName}
                    </div>
                ))}

            <button type="button" data-testid="pagination-btn" onClick={() => handlePagination(2)}>
                next
            </button>
        </div>
    ),
}));

/**
 * =========================================================
 * TEST SUITE
 * =========================================================
 */
describe('PurchaseTable Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseOrderHistory.isLoading = false;
        mockUseOrderHistory.orderDetails = [];
        mockUseOrderHistory.filter = 'all';
        mockUseOrderHistory.searchInput = '';
        mockUseOrderHistory.total = 0;
    });

    /**
     * -----------------------------------------------------
     * RENDER TESTS
     * -----------------------------------------------------
     */
    it('should render Header and OrderTable', () => {
        render(<PurchaseTable />);

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('table')).toBeInTheDocument();
    });

    /**
     * -----------------------------------------------------
     * PROP VALIDATION
     * -----------------------------------------------------
     */
    it('should pass correct props to child components', () => {
        render(<PurchaseTable />);

        expect(screen.getByTestId('header-filter')).toHaveTextContent('all');
        expect(screen.getByTestId('header-search')).toHaveTextContent('');
        expect(screen.getByTestId('table-total')).toHaveTextContent('0');
    });

    /**
     * -----------------------------------------------------
     * STATE TESTS
     * -----------------------------------------------------
     */
    it('should show loading state', () => {
        mockUseOrderHistory.isLoading = true;

        render(<PurchaseTable />);

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
        render(<PurchaseTable />);

        expect(screen.getByTestId('empty')).toBeInTheDocument();
    });

    it('should render order data when available', () => {
        mockUseOrderHistory.orderDetails = [
            {
                key: '1',
                purchasedOn: '2026-04-20',
                productName: 'order 1',
                planName: 'basic',
                orderId: 'ORD-001',
                paymentMode: 'card',
                totalAmount: '100',
                status: 'PURCHASED',
            },
        ];

        render(<PurchaseTable />);

        expect(screen.getByText('order 1')).toBeInTheDocument();
    });

    /**
     * -----------------------------------------------------
     * INTERACTION TESTS
     * -----------------------------------------------------
     */
    it('should call filter handler', () => {
        render(<PurchaseTable />);

        fireEvent.click(screen.getByTestId('filter-btn'));

        expect(mockHandleFilterChange).toHaveBeenCalledWith('active');
    });

    it('should call search handler', () => {
        render(<PurchaseTable />);

        fireEvent.change(screen.getByTestId('search-input'), {
            target: { value: 'test' },
        });

        expect(mockHandleSearchChange).toHaveBeenCalledWith('test');
    });

    it('should call pagination handler', () => {
        mockUseOrderHistory.orderDetails = [
            {
                key: '1',
                purchasedOn: '2026-04-20',
                productName: 'order 1',
                planName: 'basic',
                orderId: 'ORD-001',
                paymentMode: 'card',
                totalAmount: '100',
                status: 'PURCHASED',
            },
        ];

        render(<PurchaseTable />);

        fireEvent.click(screen.getByTestId('pagination-btn'));

        expect(mockHandlePagination).toHaveBeenCalledWith(2);
    });
});

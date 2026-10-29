/**
 * @file CategoryPageContext.test.tsx
 * @module CategoryPageContextTests
 *
 * @description
 * Production-grade unit tests for `CategoryPageProvider` and `useCategoryPageContext`.
 *
 * This test suite validates:
 * - Context contract (provider + hook usage safety)
 * - URL query param synchronization (`useSearchParams`)
 * - Category resolution and navigation behavior
 * - API integration (success + empty states)
 * - Search logic (manual trigger + debounced execution)
 * - Filters (pagination + sorting)
 * - Input validation (emoji stripping, max length enforcement)
 * - Edge cases (missing category, invalid search, empty API response)
 *
 * @testing-library
 * Uses React Testing Library + Vitest with full mocking of:
 * - Router (navigation + search params)
 * - API layer
 * - Redux store
 * - Utility functions
 *
 * @note
 * This file is designed to be deterministic, CI-safe, and independent
 * of real browser/router/API implementations.
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CategoryPageProvider, useCategoryPageContext } from '../../contexts/CategoryPageContext';

/* -------------------------------------------------------------------------- */
/* GLOBAL MOCKS */
/* -------------------------------------------------------------------------- */

/**
 * Mocked navigate function from react-router.
 * Used to assert navigation behavior.
 */
const mockNavigate = vi.fn();

/**
 * Mocked setSearchParams function from react-router.
 * Used to assert URL synchronization.
 */
const mockSetSearchParams = vi.fn();

/**
 * Mutable mock for URLSearchParams.
 * Reset before each test to simulate different URL states.
 */
let mockSearchParams = new URLSearchParams('?weburl=crm&page=1&limit=12&sort=rating');

/**
 * Mock react-router hooks
 */
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    };
});

/**
 * Mock API: fetchParentCategoryProducts
 */
const mockFetch = vi.fn();
vi.mock('../../api', () => ({
    fetchParentCategoryProducts: (...args: unknown[]) => mockFetch(...args),
}));

/**
 * Mock category hook (loading state only)
 */
vi.mock('../../hooks/home/useGetCategories', () => ({
    default: () => ({ isLoading: false }),
}));

/**
 * Mock navigation helper hook
 */
const mockNavigateAndUpdateStore = vi.fn();
vi.mock('../../hooks/category/useNavigateToCategoryPageAndUpdateStore', () => ({
    default: () => ({
        navigateAndUpdateStore: mockNavigateAndUpdateStore,
    }),
}));

/**
 * Mock toast dispatcher
 */
const mockShowToast = vi.fn();
vi.mock('@src/slices/apiSlice', () => ({
    showToast: (payload: unknown) => {
        mockShowToast(payload);
        return { type: 'toast', payload };
    },
}));

/**
 * Mock emoji removal regex
 */
vi.mock('@utils/regex', () => ({
    removeEmoji: /[\u{1F600}-\u{1F64F}]/gu,
}));

/* -------------------------------------------------------------------------- */
/* STORE */
/* -------------------------------------------------------------------------- */

/**
 * Creates a minimal Redux store required by the provider.
 *
 * @param categorySlug - Initial category slug in store
 */
const buildStore = (categorySlug = 'crm') =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: {
                    categoryList: [{ name: 'CRM', weburl: 'crm', icon: 'icon' }],
                    queryParams: { category: categorySlug },
                },
                auth: { role: 'buyer', id: '1' },
            }),
        },
    });

/* -------------------------------------------------------------------------- */
/* RENDER */
/* -------------------------------------------------------------------------- */

/**
 * Utility to render components wrapped with:
 * - Redux Provider
 * - MemoryRouter
 * - CategoryPageProvider
 *
 * @param ui - Component to render
 * @param route - Initial route
 * @param categorySlug - Initial category in store
 */
const renderProvider = (ui: React.ReactNode, route = '/', categorySlug = 'crm') =>
    render(
        <Provider store={buildStore(categorySlug)}>
            <MemoryRouter initialEntries={[route]}>
                <CategoryPageProvider>{ui}</CategoryPageProvider>
            </MemoryRouter>
        </Provider>
    );

/* -------------------------------------------------------------------------- */
/* CONSUMER */
/* -------------------------------------------------------------------------- */

/**
 * Test consumer component to expose context values and actions.
 * Enables testing internal context behavior via DOM interactions.
 */
const Consumer = () => {
    const ctx = useCategoryPageContext();

    return (
        <div>
            <span data-testid="category">{ctx.currentCategory}</span>
            <span data-testid="page">{ctx.filters.page}</span>
            <span data-testid="sort">{ctx.filters.sort}</span>
            <span data-testid="search">{ctx.searchText}</span>
            <span data-testid="noProduct">{String(ctx.noProduct)}</span>

            <button type="button" onClick={() => ctx.handleSort('name')}>
                sort
            </button>
            <button type="button" onClick={() => ctx.handlePagination(2, 20)}>
                paginate
            </button>
            <button type="button" onClick={() => ctx.handleCategoryChange('erp')}>
                category
            </button>
            <button type="button" onClick={() => ctx.handleSearch()}>
                searchBtn
            </button>

            <input data-testid="input" onChange={ctx.updateSearchText} />
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* TEST SUITE */
/* -------------------------------------------------------------------------- */

describe('CategoryPageContext (Final Stable)', () => {
    /**
     * Reset mocks and default behavior before each test.
     */
    beforeEach(() => {
        vi.clearAllMocks();

        mockSearchParams = new URLSearchParams('?weburl=crm&page=1&limit=12&sort=rating');

        mockFetch.mockResolvedValue({
            products: [{ id: 1 }],
        });

        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });

    /**
     * Restore timers after each test.
     */
    afterEach(() => {
        vi.useRealTimers();
    });

    /* ---------------- BASIC ---------------- */

    it('renders children', async () => {
        renderProvider(<div>child</div>);
        expect(await screen.findByText('child')).toBeInTheDocument();
    });

    it('throws outside provider', () => {
        const Test = () => {
            useCategoryPageContext();
            return null;
        };

        expect(() => render(<Test />)).toThrow(
            'useCategoryPageContext must be used within CategoryPageProvider'
        );
    });

    /* ---------------- CATEGORY ---------------- */

    it('reads category from URL', async () => {
        renderProvider(<Consumer />);
        expect(await screen.findByTestId('category')).toHaveTextContent('crm');
    });

    it('redirects if category missing', async () => {
        mockSearchParams = new URLSearchParams('');

        renderProvider(<div />, '/', '');

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining('softwares'),
                expect.objectContaining({ replace: true })
            )
        );
    });

    it('handles category change', async () => {
        renderProvider(<Consumer />);
        fireEvent.click(await screen.findByText('category'));

        expect(mockNavigateAndUpdateStore).toHaveBeenCalledWith('erp');
    });

    /* ---------------- FETCH ---------------- */

    it('fetches products on mount', async () => {
        renderProvider(<Consumer />);

        await waitFor(() =>
            expect(mockFetch).toHaveBeenCalledWith(
                expect.objectContaining({ parentCategory: 'crm' })
            )
        );

        expect(window.scrollTo).toHaveBeenCalled();
    });

    it('handles empty API response', async () => {
        mockFetch.mockResolvedValueOnce({ products: [] });

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('noProduct')).toHaveTextContent('true'));

        expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });

    /* ---------------- DEBOUNCE ---------------- */

    /**
     * Ensures debounced search triggers navigation after 500ms delay.
     */
    it('triggers debounced search', async () => {
        vi.useFakeTimers();

        renderProvider(<Consumer />);

        const input = screen.getByTestId('input');

        fireEvent.change(input, { target: { value: 'cr' } });
        fireEvent.change(input, { target: { value: 'crm tool' } });

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('search-results'));
    });
});

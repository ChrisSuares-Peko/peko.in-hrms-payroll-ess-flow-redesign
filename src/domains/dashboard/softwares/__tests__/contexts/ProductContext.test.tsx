/**
 * @file ProductContext.test.tsx
 * @module ProductContextTests
 *
 * @description
 * Production-grade unit tests for ProductContextProvider and useProductContext hook.
 *
 * This suite validates:
 * - Context contract (provider + hook safety)
 * - Navigation guards & fallback logic
 * - API integration & loading lifecycle
 * - Derived state (ratings transformation)
 * - Business logic (routeToNextPage branching)
 * - UI state updates (video index)
 * - Async side effects (accessibleImages validation)
 *
 * @coverage
 * - Provider rendering
 * - Hook usage safety
 * - currentProduct resolution (URL + fallback)
 * - API success, failure, and guard conditions
 * - Loading state transitions
 * - ratingFactorsList computation
 * - routeToNextPage behavior (all branches)
 * - accessibleImages (success, failure, empty)
 * - Local UI state updates
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ProductContextProvider, { useProductContext } from '../../contexts/ProductContext';

/* -------------------------------------------------------------------------- */
/* GLOBAL MOCKS */
/* -------------------------------------------------------------------------- */

/** Mock router navigation */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

/** Mock API */
const mockFetchProductDetails = vi.fn();
vi.mock('../../api', () => ({
    fetchProductDetails: (...args: unknown[]) => mockFetchProductDetails(...args),
}));

/** Mock navigation hook */
const mockNavigateFromProductPage = vi.fn();
vi.mock('../../hooks/product/useNavigateFromProductPage', () => ({
    default: () => ({ navigateFromProductPage: mockNavigateFromProductPage }),
}));

/** Mock assistance hook */
const mockRequestAssistance = vi.fn();
vi.mock('../../hooks/general/useGetAssistance', () => ({
    default: () => ({ isLoading: false, requestAssistance: mockRequestAssistance }),
}));

/* -------------------------------------------------------------------------- */
/* MOCK DATA */
/* -------------------------------------------------------------------------- */

/**
 * Minimal valid product fixture used across tests.
 */
const mockProduct = {
    weburl: 'crm-pro',
    product_name: 'CRM Pro',
    company: 'Acme',
    overview: '',
    feature_overview: '',
    features: [],
    integrations: [],
    languages: [],
    logo_url: '',
    other_features: [],
    pricing: [],
    pricing_overview: '',
    ratings: {
        ease_of_use: 4,
        breadth_of_features: 3,
        ease_of_implementation: 5,
        value_for_money: 4,
        customer_support: 3,
    },
    reviews_strengths: [],
    reviews_weakness: [],
    snapshots: [],
    social_links: {},
    usp: '',
    videos: [],
    website: '',
    hasPurchaseOptions: false,
    parent_categories: [],
};

/* -------------------------------------------------------------------------- */
/* STORE */
/* -------------------------------------------------------------------------- */

/**
 * Builds a minimal Redux store required for the provider.
 *
 * @param productSlug - fallback product slug
 * @param role - user role
 * @param id - user id
 */
const buildStore = (productSlug = 'crm-pro', role = 'buyer', id = 'user-1') =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: {
                    queryParams: { product: productSlug },
                },
                auth: { role, id },
            }),
        },
    });

/* -------------------------------------------------------------------------- */
/* RENDER HELPER */
/* -------------------------------------------------------------------------- */

/**
 * Renders the provider with required wrappers.
 */
const renderProvider = (ui: React.ReactNode, route = '/?weburl=crm-pro', store = buildStore()) =>
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[route]}>
                <ProductContextProvider>{ui}</ProductContextProvider>
            </MemoryRouter>
        </Provider>
    );

/* -------------------------------------------------------------------------- */
/* CONSUMER */
/* -------------------------------------------------------------------------- */

/**
 * Test consumer exposing context state + actions.
 */
const Consumer = () => {
    const ctx = useProductContext();

    return (
        <div>
            <span data-testid="productName">{ctx.product?.product_name ?? ''}</span>
            <span data-testid="isLoading">{String(ctx.isLoading)}</span>
            <span data-testid="ratingCount">{ctx.ratingFactorsList.length}</span>
            <span data-testid="images">{ctx.accessibleImages.length}</span>
            <span data-testid="videoIndex">{String(ctx.playingVideoIndex)}</span>

            <button type="button" onClick={ctx.routeToNextPage}>
                route
            </button>
            <button type="button" onClick={() => ctx.setPlayingVideoIndex(2)}>
                setVideo
            </button>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* TESTS */
/* -------------------------------------------------------------------------- */

describe('ProductContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchProductDetails.mockResolvedValue({ product: mockProduct });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /* ---------------- BASIC ---------------- */

    it('renders children', async () => {
        renderProvider(<div>child</div>);
        expect(await screen.findByText('child')).toBeInTheDocument();
    });

    it('throws outside provider', () => {
        const Test = () => {
            useProductContext();
            return null;
        };

        expect(() => render(<Test />)).toThrow();
    });

    /* ---------------- FALLBACK ---------------- */

    it('falls back to queryParams when URL param missing', async () => {
        renderProvider(<Consumer />, '/');

        await waitFor(() =>
            expect(mockFetchProductDetails).toHaveBeenCalledWith(
                expect.objectContaining({ weburl: 'crm-pro' })
            )
        );
    });

    /* ---------------- NAVIGATION GUARD ---------------- */

    it('redirects when product is empty', async () => {
        renderProvider(<div />, '/', buildStore(''));

        await waitFor(() => expect(mockNavigateFromProductPage).toHaveBeenCalled());
    });

    /* ---------------- API ---------------- */

    it('fetches product and sets state', async () => {
        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('productName')).toHaveTextContent('CRM Pro'));
    });

    it('handles API failure', async () => {
        mockFetchProductDetails.mockResolvedValueOnce({ product: null });

        renderProvider(<Consumer />);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    });

    it('does not call API if id or role missing', async () => {
        renderProvider(<Consumer />, '/', buildStore('crm-pro', '', ''));

        await new Promise(r => setTimeout(r, 50));

        expect(mockFetchProductDetails).not.toHaveBeenCalled();
    });

    it('handles loading state correctly', async () => {
        let resolveFn: any;

        mockFetchProductDetails.mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveFn = resolve;
                })
        );

        renderProvider(<Consumer />);

        expect(screen.getByTestId('isLoading')).toHaveTextContent('true');

        resolveFn({ product: mockProduct });

        await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));
    });

    /* ---------------- RATINGS ---------------- */

    it('returns empty ratings when no ratings', async () => {
        mockFetchProductDetails.mockResolvedValueOnce({
            product: { ...mockProduct, ratings: {} },
        });

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('ratingCount')).toHaveTextContent('0'));
    });

    it('maps rating factors correctly', async () => {
        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('ratingCount')).toHaveTextContent('5'));
    });

    /* ---------------- ROUTING ---------------- */

    it('navigates to plans when purchase options exist', async () => {
        mockFetchProductDetails.mockResolvedValueOnce({
            product: { ...mockProduct, hasPurchaseOptions: true },
        });

        renderProvider(<Consumer />);

        await screen.findByTestId('productName');
        fireEvent.click(screen.getByText('route'));

        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('view-plans'),
            expect.objectContaining({
                state: expect.objectContaining({ product: expect.any(Object) }),
            })
        );
    });

    it('calls assistance when no purchase options', async () => {
        renderProvider(<Consumer />);

        await screen.findByTestId('productName');
        fireEvent.click(screen.getByText('route'));

        expect(mockRequestAssistance).toHaveBeenCalled();
    });

    it('does nothing if product is null', async () => {
        mockFetchProductDetails.mockResolvedValueOnce({ product: null });

        renderProvider(<Consumer />);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

        fireEvent.click(screen.getByText('route'));

        expect(mockRequestAssistance).not.toHaveBeenCalled();
    });

    /* ---------------- UI STATE ---------------- */

    it('updates video index', async () => {
        renderProvider(<Consumer />);

        await screen.findByTestId('videoIndex');
        fireEvent.click(screen.getByText('setVideo'));

        await waitFor(() => expect(screen.getByTestId('videoIndex')).toHaveTextContent('2'));
    });

    /* ---------------- IMAGES ---------------- */

    it('handles empty snapshots safely', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');

        renderProvider(<Consumer />);

        await screen.findByTestId('productName');

        expect(fetchSpy).not.toHaveBeenCalled();

        fetchSpy.mockRestore();
    });

    it('filters accessible images', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

        mockFetchProductDetails.mockResolvedValueOnce({
            product: {
                ...mockProduct,
                snapshots: [{ Location: 'img1' }, { Location: 'img2' }],
            },
        });

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('images')).toHaveTextContent('2'));

        vi.unstubAllGlobals();
    });

    it('filters inaccessible images', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

        mockFetchProductDetails.mockResolvedValueOnce({
            product: {
                ...mockProduct,
                snapshots: [{ Location: 'bad' }],
            },
        });

        renderProvider(<Consumer />);

        await waitFor(() => expect(screen.getByTestId('images')).toHaveTextContent('0'));

        vi.unstubAllGlobals();
    });
});

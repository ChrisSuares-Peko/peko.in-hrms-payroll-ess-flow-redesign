/**
 * @file useProductCard.test.tsx
 * @description Unit tests for useProductCard hook.
 *
 * Test coverage:
 *  - cardImageSize defaults to 60 when no breakpoint is active
 *  - cardImageSize is 40 for xs screens
 *  - cardImageSize is 50 for md screens
 *  - cardImageSize is 40 for lg screens
 *  - routeToProductPage from softwares index navigates with full path
 *  - routeToProductPage from category page navigates with relative path
 *  - routeToProductPage from search-results navigates with relative path
 *  - routeToProductPage from success page navigates with relative path
 *  - routeToProductPage from unknown route falls back to softwares index
 *  - routeToProductPage dispatches setQueryParams with weburl
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useProductCard from '../../../hooks/general/useProductCard';
import { IProductCard } from '../../../types';

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

/** Control breakpoints returned by useScreenSize (antd Grid.useBreakpoint) */
const mockScreenSize = vi.fn(() => ({}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => mockScreenSize(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildStore = () =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: { queryParams: { product: '', category: '', search: '' } },
                auth: { id: 'user-1', role: 'buyer' },
            }),
        },
    });

const mockProduct: IProductCard = {
    weburl: 'slack',
    logo_url: '',
    product_name: 'Slack',
    company: 'Slack Technologies',
    website: 'https://slack.com',
    overview: 'Messaging platform',
    ratings: {
        overall_rating: 4.5,
        total_reviews: 100,
        ease_of_implementation: 4,
        ease_of_use: 4.5,
        value_for_money: 4,
        breadth_of_features: 4,
        customer_support: 4,
    },
    hasPurchaseOptions: false,
};

const makeWrapper = (initialPath = '/softwares') => {
    const store = buildStore();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        </Provider>
    );
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useProductCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockScreenSize.mockReturnValue({});
    });

    // -------------------------------------------------------------------------
    // cardImageSize
    // -------------------------------------------------------------------------

    /**
     * @test Default size when no breakpoint flag is active.
     */
    it('returns cardImageSize=60 when no breakpoint is active', () => {
        mockScreenSize.mockReturnValue({});
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper(),
        });
        expect(result.current.cardImageSize).toBe(60);
    });

    /**
     * @test xs breakpoint → size 40.
     */
    it('returns cardImageSize=40 for xs screens', () => {
        mockScreenSize.mockReturnValue({ xs: true });
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper(),
        });
        expect(result.current.cardImageSize).toBe(40);
    });

    /**
     * @test md breakpoint → size 50.
     */
    it('returns cardImageSize=50 for md screens', () => {
        mockScreenSize.mockReturnValue({ md: true });
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper(),
        });
        expect(result.current.cardImageSize).toBe(50);
    });

    /**
     * @test lg breakpoint → size 40.
     */
    it('returns cardImageSize=40 for lg screens', () => {
        mockScreenSize.mockReturnValue({ lg: true });
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper(),
        });
        expect(result.current.cardImageSize).toBe(40);
    });

    // -------------------------------------------------------------------------
    // routeToProductPage — navigation paths
    // -------------------------------------------------------------------------

    /**
     * @test From softwares index → full path navigation.
     */
    it('navigates with full path when current route is softwares index', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/softwares'),
        });

        act(() => {
            result.current.routeToProductPage('slack');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares/product?weburl=slack');
    });

    /**
     * @test From category page → relative path navigation.
     */
    it('navigates with relative path when current route is category', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/softwares/category'),
        });

        act(() => {
            result.current.routeToProductPage('notion');
        });

        expect(mockNavigate).toHaveBeenCalledWith('product?weburl=notion');
    });

    /**
     * @test From search-results page → relative path navigation.
     */
    it('navigates with relative path when current route is search-results', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/softwares/search-results'),
        });

        act(() => {
            result.current.routeToProductPage('jira');
        });

        expect(mockNavigate).toHaveBeenCalledWith('product?weburl=jira');
    });

    /**
     * @test From success page → relative path navigation.
     */
    it('navigates with relative path when current route is success', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/softwares/success'),
        });

        act(() => {
            result.current.routeToProductPage('asana');
        });

        expect(mockNavigate).toHaveBeenCalledWith('product?weburl=asana');
    });

    /**
     * @test Unknown route falls back to softwares index.
     */
    it('falls back to softwares index for an unknown route', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/some/unknown/page'),
        });

        act(() => {
            result.current.routeToProductPage('monday');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/softwares');
    });

    // -------------------------------------------------------------------------
    // routeToProductPage — dispatch
    // -------------------------------------------------------------------------

    /**
     * @test Dispatches setQueryParams with the given weburl on any route.
     */
    it('dispatches setQueryParams with weburl when routing to product page', () => {
        const { result } = renderHook(() => useProductCard(mockProduct), {
            wrapper: makeWrapper('/softwares'),
        });

        act(() => {
            result.current.routeToProductPage('slack');
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: { product: 'slack' },
            })
        );
    });
});

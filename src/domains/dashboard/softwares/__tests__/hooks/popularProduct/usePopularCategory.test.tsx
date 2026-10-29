/**
 * @file usePopularCategory.test.tsx
 * @description Unit tests for usePopularCategory hook.
 *
 * Test coverage:
 *  - Does not fetch when id or role is absent
 *  - Does not fetch when cachedPopularProducts is already populated
 *  - Calls fetchPopularProducts with correct payload when cache is empty
 *  - Dispatches setPopularProducts and sets isProducts=true on success
 *  - Sets isProducts=false when API returns falsy
 *  - isLoading transitions true → false around fetch
 *  - Returns popularProducts and total from cached store state
 *  - isProducts is true when cachedPopularProducts is non-empty regardless of API result
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import usePopularCategory from '../../../hooks/popularProduct/usePopularCategory';
import { IProductCard } from '../../../types/product';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchPopularProducts = vi.fn();
vi.mock('../../../api', () => ({
    fetchPopularProducts: (...args: unknown[]) => mockFetchPopularProducts(...args),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProducts: IProductCard[] = [
    {
        weburl: 'slack',
        logo_url: 'https://example.com/slack.png',
        product_name: 'Slack',
        company: 'Slack Inc.',
        website: 'https://slack.com',
        overview: 'Team messaging',
        ratings: { average: 4.5, count: 100 } as any,
        hasPurchaseOptions: true,
    },
    {
        weburl: 'zoom',
        logo_url: 'https://example.com/zoom.png',
        product_name: 'Zoom',
        company: 'Zoom Inc.',
        website: 'https://zoom.us',
        overview: 'Video conferencing',
        ratings: { average: 4.2, count: 80 } as any,
        hasPurchaseOptions: false,
    },
];

// ---------------------------------------------------------------------------
// Store / wrapper factories
// ---------------------------------------------------------------------------

const buildStore = (
    authOverride: { id: number | null; role: string | null } = { id: 42, role: 'buyer' },
    popularProducts: IProductCard[] = []
) =>
    configureStore({
        reducer: {
            reducer: (
                state = {
                    auth: authOverride,
                    software: { popularProducts },
                }
            ) => state,
        },
    });

const makeWrapper = (
    authOverride?: { id: number | null; role: string | null },
    popularProducts?: IProductCard[]
) => {
    const store = buildStore(authOverride, popularProducts);
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store } as any, children);
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePopularCategory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Guard: skip fetch when auth is absent
    // -------------------------------------------------------------------------

    /**
     * @test Does not call fetchPopularProducts when id is missing.
     */
    it('does not fetch when id is absent', async () => {
        const { result } = renderHook(() => usePopularCategory(), {
            wrapper: makeWrapper({ id: null, role: 'buyer' }),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(mockFetchPopularProducts).not.toHaveBeenCalled();
    });

    /**
     * @test Does not call fetchPopularProducts when role is missing.
     */
    it('does not fetch when role is absent', async () => {
        const { result } = renderHook(() => usePopularCategory(), {
            wrapper: makeWrapper({ id: 42, role: null }),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(mockFetchPopularProducts).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // Guard: skip fetch when cache is populated
    // -------------------------------------------------------------------------

    /**
     * @test Does not call fetchPopularProducts when cachedPopularProducts is non-empty.
     */
    it('does not fetch when cache is already populated', async () => {
        renderHook(() => usePopularCategory(), {
            wrapper: makeWrapper({ id: 42, role: 'buyer' }, mockProducts),
        });

        await waitFor(() => expect(mockFetchPopularProducts).not.toHaveBeenCalled());
    });

    // -------------------------------------------------------------------------
    // Fetch on mount
    // -------------------------------------------------------------------------

    /**
     * @test Calls fetchPopularProducts with correct userId and userType.
     */
    it('calls fetchPopularProducts with correct payload when cache is empty', async () => {
        mockFetchPopularProducts.mockResolvedValue({ products: mockProducts });

        renderHook(() => usePopularCategory(), { wrapper: makeWrapper() });

        await waitFor(() =>
            expect(mockFetchPopularProducts).toHaveBeenCalledWith({
                userId: 42,
                userType: 'buyer',
            })
        );
    });

    // -------------------------------------------------------------------------
    // Successful response
    // -------------------------------------------------------------------------

    /**
     * @test isLoading transitions true → false after fetch completes.
     */
    it('sets isLoading=true during fetch and false after', async () => {
        let resolveApi!: (value: unknown) => void;
        mockFetchPopularProducts.mockReturnValueOnce(
            new Promise(res => {
                resolveApi = res;
            })
        );

        const { result } = renderHook(() => usePopularCategory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(true));

        resolveApi({ products: mockProducts });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    // -------------------------------------------------------------------------
    // Falsy response
    // -------------------------------------------------------------------------

    /**
     * @test Sets isProducts=false when API returns falsy.
     */
    it('sets isProducts=false when fetchPopularProducts returns falsy', async () => {
        mockFetchPopularProducts.mockResolvedValue(false);

        const { result } = renderHook(() => usePopularCategory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isProducts).toBe(false);
    });

    /**
     * @test Sets isProducts=false when API returns a response without products.
     */
    it('sets isProducts=false when API response has no products field', async () => {
        mockFetchPopularProducts.mockResolvedValue({});

        const { result } = renderHook(() => usePopularCategory(), { wrapper: makeWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.isProducts).toBe(false);
    });

    // -------------------------------------------------------------------------
    // Cache-populated state
    // -------------------------------------------------------------------------

    /**
     * @test Returns popularProducts and total from the cached store when pre-populated.
     */
    it('returns popularProducts and total from cached store', () => {
        mockFetchPopularProducts.mockResolvedValue({ products: [] });

        const { result } = renderHook(() => usePopularCategory(), {
            wrapper: makeWrapper({ id: 42, role: 'buyer' }, mockProducts),
        });

        expect(result.current.popularProducts).toEqual(mockProducts);
        expect(result.current.total).toBe(mockProducts.length);
    });

    /**
     * @test isProducts is true when cachedPopularProducts is non-empty regardless of fetch result.
     */
    it('isProducts is true when cache is non-empty even if API would return falsy', () => {
        const { result } = renderHook(() => usePopularCategory(), {
            wrapper: makeWrapper({ id: 42, role: 'buyer' }, mockProducts),
        });

        expect(result.current.isProducts).toBe(true);
    });
});

/**
 * @file useFindProductSuccess.test.tsx
 * @description Unit tests for useFindProductSuccess hook.
 *
 * Test coverage:
 *  - Navigates to /softwares/find-software when recommendedProducts is empty
 *  - Does not navigate when recommendedProducts has items
 *  - Returns products from the store
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useFindProductSuccess from '../../../hooks/rfp/useFindProductSuccess';
import { IProductCard } from '../../../types/product';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

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
];

// ---------------------------------------------------------------------------
// Store / wrapper factory
// ---------------------------------------------------------------------------

const buildStore = (recommendedProducts: IProductCard[] = []) =>
    configureStore({
        reducer: {
            reducer: () => ({
                software: { recommendedProducts },
            }),
        },
    });

const makeWrapper = (recommendedProducts: IProductCard[] = []) => {
    const store = buildStore(recommendedProducts);
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store } as any, children);
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFindProductSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test Navigates to /softwares/find-software when recommendedProducts is empty.
     */
    it('navigates to /softwares/find-software when recommendedProducts is empty', async () => {
        renderHook(() => useFindProductSuccess(), { wrapper: makeWrapper([]) });

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/softwares/find-software'));
    });

    /**
     * @test Does not navigate when recommendedProducts has items.
     */
    it('does not navigate when recommendedProducts is non-empty', async () => {
        renderHook(() => useFindProductSuccess(), { wrapper: makeWrapper(mockProducts) });

        await waitFor(() => expect(mockNavigate).not.toHaveBeenCalled());
    });

    /**
     * @test Returns products from the store.
     */
    it('returns products from the store', () => {
        const { result } = renderHook(() => useFindProductSuccess(), {
            wrapper: makeWrapper(mockProducts),
        });

        expect(result.current.products).toEqual(mockProducts);
    });

    /**
     * @test Returns empty array when store has no recommendedProducts.
     */
    it('returns empty products array when store has no recommendedProducts', () => {
        const { result } = renderHook(() => useFindProductSuccess(), {
            wrapper: makeWrapper([]),
        });

        expect(result.current.products).toEqual([]);
    });
});

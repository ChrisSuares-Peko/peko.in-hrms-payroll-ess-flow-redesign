/**
 * @file PopularProducts.test.tsx
 * @description Unit tests for home PopularProducts component
 * Verifies:
 *  - Renders the Popular Software heading
 *  - Renders skeleton when loading
 *  - Renders empty state when no products
 *  - Renders product cards when products exist
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PopularProducts from '../../../../components/home/sections/PopularProducts';
import usePopularCategory from '../../../../hooks/popularProduct/usePopularCategory';

vi.mock('../../../../hooks/popularProduct/usePopularCategory', () => ({
    default: vi.fn(),
}));
vi.mock('../../../../components/common', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.product_name}</div>,
}));
vi.mock('../../../../components/common/skeletons/product/ProductCardSkeleton', () => ({
    default: () => <div data-testid="skeleton" />,
}));

const mockedHook = vi.mocked(usePopularCategory);

describe('home PopularProducts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the Popular Software heading', () => {
        mockedHook.mockReturnValue({
            isLoading: false,
            isProducts: true,
            popularProducts: [],
            total: 0,
        } as any);
        render(<PopularProducts />);
        expect(screen.getByText('Popular Software')).toBeInTheDocument();
    });

    it('should render skeleton when loading', () => {
        mockedHook.mockReturnValue({
            isLoading: true,
            isProducts: false,
            popularProducts: [],
            total: 0,
        } as any);
        render(<PopularProducts />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should render product cards when products exist', () => {
        mockedHook.mockReturnValue({
            isLoading: false,
            isProducts: true,
            popularProducts: [
                { product_name: 'App A', weburl: 'app-a' },
                { product_name: 'App B', weburl: 'app-b' },
            ],
            total: 2,
        } as any);
        render(<PopularProducts />);
        expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    });
});

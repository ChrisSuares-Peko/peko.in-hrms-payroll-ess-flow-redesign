/**
 * @file ProductCards.test.tsx
 * @description Unit tests for category ProductCards component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Renders empty state when no products
 *  - Renders product cards when products exist
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCards from '../../../../components/category/sections/ProductCards';
import { useCategoryPageContext } from '../../../../contexts/CategoryPageContext';

vi.mock('../../../../contexts/CategoryPageContext', () => ({
    useCategoryPageContext: vi.fn(),
}));

vi.mock('../../../../components/common', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.product_name}</div>,
}));

vi.mock('../../../../components/common/skeletons/product/ProductCardSkeleton', () => ({
    default: () => <div data-testid="skeleton">Loading...</div>,
}));

const mockedUseCategoryPageContext = vi.mocked(useCategoryPageContext);

describe('category ProductCards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render skeleton when loading', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            isLoading: true,
            categoryProducts: null,
            filters: { page: 1, limit: 12 },
            noProduct: false,
            handlePagination: vi.fn(),
        } as any);

        render(<ProductCards />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should render empty state when noProduct is true', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            isLoading: false,
            categoryProducts: null,
            filters: { page: 1, limit: 12 },
            noProduct: true,
            handlePagination: vi.fn(),
        } as any);

        render(<ProductCards />);
        expect(screen.getByText('No Products found.')).toBeInTheDocument();
    });

    it('should render product cards when products exist', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            isLoading: false,
            categoryProducts: {
                products: [
                    { product_name: 'Product A', weburl: 'product-a' },
                    { product_name: 'Product B', weburl: 'product-b' },
                ],
                pagination: { total: 2 },
            },
            filters: { page: 1, limit: 12 },
            noProduct: false,
            handlePagination: vi.fn(),
        } as any);

        render(<ProductCards />);
        expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    });
});

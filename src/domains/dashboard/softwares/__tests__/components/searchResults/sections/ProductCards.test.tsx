/**
 * @file ProductCards.test.tsx
 * @description Unit tests for searchResults ProductCards component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Renders empty state when no products
 *  - Renders product cards when products exist
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCards from '@src/domains/dashboard/softwares/components/searchResults/sections/ProductCards';
import { useSearchResultContext } from '@src/domains/dashboard/softwares/contexts/SearchPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SearchPageContext', () => ({
    useSearchResultContext: vi.fn(),
}));
vi.mock('@src/domains/dashboard/softwares/components/common', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.product_name}</div>,
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/common/skeletons/product/ProductCardSkeleton',
    () => ({
        default: () => <div data-testid="skeleton" />,
    })
);

const mockedUseSearchResultContext = vi.mocked(useSearchResultContext);

describe('searchResults ProductCards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render skeleton when loading', () => {
        mockedUseSearchResultContext.mockReturnValue({ products: [], isLoading: true } as any);
        render(<ProductCards />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should render empty state when no products', () => {
        mockedUseSearchResultContext.mockReturnValue({ products: [], isLoading: false } as any);
        render(<ProductCards />);
        expect(
            screen.getByText('No matching products found. Please try a different search term.')
        ).toBeInTheDocument();
    });

    it('should render product cards when products exist', () => {
        mockedUseSearchResultContext.mockReturnValue({
            products: [
                { product_name: 'App A', weburl: 'app-a' },
                { product_name: 'App B', weburl: 'app-b' },
            ],
            isLoading: false,
        } as any);
        render(<ProductCards />);
        expect(screen.getAllByTestId('product-card')).toHaveLength(2);
    });
});

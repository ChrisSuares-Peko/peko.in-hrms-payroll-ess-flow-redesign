/**
 * @file productCardOverView.test.tsx
 * @description Unit tests for ProductCardOverView component
 * Verifies:
 *  - Renders overview text
 *  - Read More button calls routeToProductPage
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCardOverView from '../../../components/common/productCardOverView';

const mockRouteToProductPage = vi.fn();

vi.mock('../../../hooks/general/useProductCard', () => ({
    default: () => ({ routeToProductPage: mockRouteToProductPage }),
}));

const mockProduct = {
    product_name: 'Test Product',
    weburl: 'test-product',
    ratings: { overall_rating: 4, total_reviews: 10 },
} as any;

describe('ProductCardOverView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the overview text', () => {
        render(<ProductCardOverView text="Some overview text" product={mockProduct} />);
        expect(screen.getByText('Some overview text')).toBeInTheDocument();
    });

    it('should render Read More button', () => {
        render(<ProductCardOverView text="Overview" product={mockProduct} />);
        expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('should call routeToProductPage when Read More is clicked', () => {
        render(<ProductCardOverView text="Overview" product={mockProduct} />);
        fireEvent.click(screen.getByText('Read More'));
        expect(mockRouteToProductPage).toHaveBeenCalledWith('test-product');
    });
});

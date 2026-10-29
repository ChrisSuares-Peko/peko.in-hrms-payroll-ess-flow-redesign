/**
 * @file ProductCard.test.tsx
 * @description Unit tests for ProductCard component
 * Verifies:
 *  - Renders product name, company, and rating
 *  - Calls routeToProductPage on View button click
 */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCard from '../../../components/common/ProductCard';

const mockRouteToProductPage = vi.fn();

vi.mock('../../../hooks/general/useProductCard', () => ({
    default: () => ({
        cardImageSize: 60,
        routeToProductPage: mockRouteToProductPage,
    }),
}));

vi.mock('../../../components/common/productCardOverView', () => ({
    default: ({ text }: any) => <div data-testid="overview">{text}</div>,
}));

vi.mock('@src/domains/dashboard/softwares/assets/images/defalultProductCardImage.svg', () => ({
    default: 'default-image.svg',
}));

const mockProduct = {
    product_name: 'Test Product',
    company: 'Test Company',
    website: 'https://test.com',
    logo_url: 'https://test.com/logo.png',
    overview: 'Test overview',
    weburl: 'test-product',
    ratings: {
        overall_rating: 4.5,
        total_reviews: 100,
    },
};

describe('ProductCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render product name and company', () => {
        render(<ProductCard product={mockProduct as any} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('should render rating and review count', () => {
        render(<ProductCard product={mockProduct as any} />);
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('(100 reviews)')).toBeInTheDocument();
    });

    it('should call routeToProductPage when View button is clicked', () => {
        render(<ProductCard product={mockProduct as any} />);
        fireEvent.click(screen.getByText('View'));
        expect(mockRouteToProductPage).toHaveBeenCalledWith('test-product');
    });

    it('should show 0.0 rating when overall_rating is null', () => {
        const product = { ...mockProduct, ratings: { overall_rating: null, total_reviews: 0 } };
        render(<ProductCard product={product as any} />);
        expect(screen.getByText('0.0')).toBeInTheDocument();
    });
});

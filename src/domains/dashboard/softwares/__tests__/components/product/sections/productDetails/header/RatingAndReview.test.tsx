/**
 * @file RatingAndReview.test.tsx
 * @description Unit tests for product header RatingAndReview component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders overall rating and review count
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RatingAndReview from '@src/domains/dashboard/softwares/components/product/sections/productDetails/header/RatingAndReview';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('product header RatingAndReview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<RatingAndReview />);
        expect(container.firstChild).toBeNull();
    });

    it('should render overall rating', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                ratings: { overall_rating: 4.3, total_reviews: 50 },
            },
        } as any);
        render(<RatingAndReview />);
        expect(screen.getByText('4.3')).toBeInTheDocument();
        expect(screen.getByText('( 50 reviews )')).toBeInTheDocument();
    });
});

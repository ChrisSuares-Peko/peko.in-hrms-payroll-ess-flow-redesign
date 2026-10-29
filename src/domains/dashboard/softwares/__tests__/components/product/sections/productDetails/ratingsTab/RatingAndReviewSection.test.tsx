/**
 * @file RatingAndReviewSection.test.tsx
 * @description Unit tests for RatingAndReviewSection component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders Rating Overview heading
 *  - Renders overall rating value
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RatingAndReviewSection from '@src/domains/dashboard/softwares/components/product/sections/productDetails/ratingsTab/RatingAndReviewSection';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('RatingAndReviewSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<RatingAndReviewSection />);
        expect(container.firstChild).toBeNull();
    });

    it('should render Rating Overview heading', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                ratings: { overall_rating: 4.2, total_reviews: 30 },
            },
            ratingFactorsList: [],
        } as any);
        render(<RatingAndReviewSection />);
        expect(screen.getByText('Rating Overview')).toBeInTheDocument();
    });

    it('should render overall rating value', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                ratings: { overall_rating: 4.2, total_reviews: 30 },
            },
            ratingFactorsList: [],
        } as any);
        render(<RatingAndReviewSection />);
        expect(screen.getByText('4.2')).toBeInTheDocument();
        expect(screen.getByText('Based on 30 reviews')).toBeInTheDocument();
    });
});

/**
 * @file index.test.tsx
 * @description Unit tests for product details header component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Returns null when product is null
 *  - Renders product name and company
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductHeader from '@src/domains/dashboard/softwares/components/product/sections/productDetails/header/index';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/product/sections/productDetails/header/RatingAndReview',
    () => ({
        default: () => <div data-testid="rating" />,
    })
);
vi.mock(
    '@src/domains/dashboard/softwares/components/common/skeletons/product/ProductTopSectionSkeleton',
    () => ({
        default: () => <div data-testid="top-skeleton" />,
    })
);
vi.mock('@src/domains/dashboard/softwares/assets/images/defalultProductCardImage.svg', () => ({
    default: 'default.svg',
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('product details header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render skeleton when loading', () => {
        mockedUseProductContext.mockReturnValue({ isLoading: true, product: null } as any);
        render(<ProductHeader />);
        expect(screen.getByTestId('top-skeleton')).toBeInTheDocument();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<ProductHeader />);
        expect(container.firstChild).toBeNull();
    });

    it('should render product name and company', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                product_name: 'Awesome Software',
                company: 'Tech Corp',
                website: 'https://techcorp.com',
                logo_url: 'logo.png',
                ratings: { overall_rating: 4.0, total_reviews: 20 },
                weburl: 'awesome-software',
            },
        } as any);
        render(<ProductHeader />);
        expect(screen.getByText('Awesome Software')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });
});

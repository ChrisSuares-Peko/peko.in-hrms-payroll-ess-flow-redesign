/**
 * @file index.test.tsx
 * @description Unit tests for OverViewTab component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders Details section when product has overview
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import OverViewTab from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/index';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock('../../../../../components/product/sections/productDetails/overViewTab/Languages', () => ({
    default: () => <div>Languages</div>,
}));
vi.mock(
    '../../../../../components/product/sections/productDetails/overViewTab/ParentCategories',
    () => ({ default: () => <div>ParentCategories</div> })
);
vi.mock(
    '../../../../../components/product/sections/productDetails/overViewTab/SocialLinks',
    () => ({ default: () => <div>SocialLinks</div> })
);
vi.mock(
    '../../../../../components/product/sections/productDetails/overViewTab/VideoPlayer',
    () => ({ default: () => <div>VideoPlayer</div> })
);
vi.mock('../../../../../components/product/sections/productDetails/ContentHeadAndBody', () => ({
    default: ({ header, children }: any) => (
        <div>
            <span>{header}</span>
            {children}
        </div>
    ),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('OverViewTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<OverViewTab />);
        expect(container.firstChild).toBeNull();
    });

    it('should render Details when product has overview', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                overview: 'Great product',
                videos: [],
                usp: null,
                social_links: {},
                parent_categories: [],
                languages: [],
            },
        } as any);
        render(<OverViewTab />);
        expect(screen.getByText('Details')).toBeInTheDocument();
    });
});

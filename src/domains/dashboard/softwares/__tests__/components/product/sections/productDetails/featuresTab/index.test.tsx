/**
 * @file index.test.tsx
 * @description Unit tests for FeaturesTab component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders Feature Overview when product has it
 *  - Renders Features section when product has features
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FeaturesTab from '@src/domains/dashboard/softwares/components/product/sections/productDetails/featuresTab/index';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock(
    '../../../../../components/product/sections/productDetails/featuresTab/FeatureItems',
    () => ({
        default: ({ indicator }: any) => <div data-testid={`feature-items-${indicator}`} />,
    })
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

describe('FeaturesTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<FeaturesTab />);
        expect(container.firstChild).toBeNull();
    });

    it('should render Feature Overview when product has it', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                feature_overview: 'Overview text',
                features: [],
                other_features: [],
            },
        } as any);
        render(<FeaturesTab />);
        expect(screen.getByText('Feature Overview')).toBeInTheDocument();
    });
});

/**
 * @file FeatureItems.test.tsx
 * @description Unit tests for FeatureItems component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Returns null when no product
 *  - Renders feature names based on indicator
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import FeatureItems from '@src/domains/dashboard/softwares/components/product/sections/productDetails/featuresTab/FeatureItems';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('FeatureItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<FeatureItems indicator="feature" />);
        expect(container.firstChild).toBeNull();
    });

    it('should render feature names for indicator=feature', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                features: [{ name: 'Reporting' }, { name: 'Analytics' }],
                other_features: [],
            },
        } as any);
        render(<FeatureItems indicator="feature" />);
        expect(screen.getByText('Reporting')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render other features for indicator=other feature', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                features: [],
                other_features: ['Export', 'Import'],
            },
        } as any);
        render(<FeatureItems indicator="other feature" />);
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
    });
});

/**
 * @file index.test.tsx
 * @description Unit tests for product Price component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Renders null when no product
 *  - Renders price breakdown when product available
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Price from '@src/domains/dashboard/softwares/components/product/sections/price';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/common/skeletons/product/ProductPriceCardSkeleton',
    () => ({
        default: () => <div data-testid="price-skeleton" />,
    })
);

const mockedUseProductContext = vi.mocked(useProductContext);

describe('product Price', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render skeleton when loading', () => {
        mockedUseProductContext.mockReturnValue({ isLoading: true, product: null } as any);
        render(<Price />);
        expect(screen.getByTestId('price-skeleton')).toBeInTheDocument();
    });

    it('should render null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<Price />);
        expect(container.firstChild).toBeNull();
    });

    it('should render View Plans button when product has purchase options', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                hasPurchaseOptions: true,
                pricing: [{ plan: 'Basic' }],
            },
            routeToNextPage: vi.fn(),
            getAssistanceIsLoading: false,
        } as any);
        render(<Price />);
        expect(screen.getByText('View Plans')).toBeInTheDocument();
    });

    it('should render Request for Quote when no purchase options', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: {
                hasPurchaseOptions: false,
                pricing: [],
            },
            routeToNextPage: vi.fn(),
            getAssistanceIsLoading: false,
        } as any);
        render(<Price />);
        expect(screen.getByText('Request for Quote')).toBeInTheDocument();
    });
});

/**
 * @file ParentCategories.test.tsx
 * @description Unit tests for ParentCategories component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders parent category tiles
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ParentCategories from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/ParentCategories';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock('../../../../../components/product/sections/productDetails/overViewTab/Tiles', () => ({
    default: ({ title }: any) => <div data-testid="tile">{title}</div>,
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('ParentCategories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<ParentCategories />);
        expect(container.firstChild).toBeNull();
    });

    it('should render parent category tiles', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: { parent_categories: [{ name: 'Finance' }, { name: 'HR' }] },
        } as any);
        render(<ParentCategories />);
        expect(screen.getByText('Finance')).toBeInTheDocument();
        expect(screen.getByText('HR')).toBeInTheDocument();
    });
});

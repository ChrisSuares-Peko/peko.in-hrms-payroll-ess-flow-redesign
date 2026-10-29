/**
 * @file Languages.test.tsx
 * @description Unit tests for Languages component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders language tiles
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Languages from '@src/domains/dashboard/softwares/components/product/sections/productDetails/overViewTab/Languages';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

vi.mock('@src/domains/dashboard/softwares/contexts/ProductContext', () => ({
    useProductContext: vi.fn(),
}));
vi.mock('../../../../../components/product/sections/productDetails/overViewTab/Tiles', () => ({
    default: ({ title }: any) => <div data-testid="tile">{title}</div>,
}));

const mockedUseProductContext = vi.mocked(useProductContext);

describe('Languages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseProductContext.mockReturnValue({ product: null, isLoading: false } as any);
        const { container } = render(<Languages />);
        expect(container.firstChild).toBeNull();
    });

    it('should render language tiles', () => {
        mockedUseProductContext.mockReturnValue({
            isLoading: false,
            product: { languages: [{ name: 'English' }, { name: 'Arabic' }] },
        } as any);
        render(<Languages />);
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Arabic')).toBeInTheDocument();
    });
});

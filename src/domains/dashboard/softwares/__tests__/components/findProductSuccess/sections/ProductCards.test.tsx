/**
 * @file ProductCards.test.tsx
 * @description Unit tests for findProductSuccess ProductCards component
 * Verifies:
 *  - Renders a card for each product returned by the hook
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCards from '../../../../components/findProductSuccess/sections/ProductCards';
import useFindProductSuccess from '../../../../hooks/rfp/useFindProductSuccess';

vi.mock('../../../../hooks/rfp/useFindProductSuccess', () => ({
    default: vi.fn(),
}));

vi.mock('../../../../components/common', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.product_name}</div>,
}));

const mockedHook = vi.mocked(useFindProductSuccess);

describe('findProductSuccess ProductCards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render a card for each product', () => {
        mockedHook.mockReturnValue({
            products: [
                { product_name: 'Product A', weburl: 'a' },
                { product_name: 'Product B', weburl: 'b' },
            ],
        } as any);

        render(<ProductCards />);
        expect(screen.getAllByTestId('product-card')).toHaveLength(2);
        expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    it('should render nothing when products list is empty', () => {
        mockedHook.mockReturnValue({ products: [] } as any);
        render(<ProductCards />);
        expect(screen.queryByTestId('product-card')).not.toBeInTheDocument();
    });
});

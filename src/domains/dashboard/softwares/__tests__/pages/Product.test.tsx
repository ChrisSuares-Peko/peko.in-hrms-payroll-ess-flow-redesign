/**
 * @file Product.test.tsx
 * @module ProductPageTests
 * @description
 * Unit tests for the Product page component.
 *
 * This test suite focuses on validating the structural responsibilities
 * of the Product page, ensuring correct composition, provider integration,
 * and layout consistency while isolating external dependencies.
 *
 * @remarks
 * - Child components are mocked to isolate page-level behavior.
 * - Context provider is mocked to verify wrapping without relying on internal logic.
 * - Business logic and UI behavior of children are tested in their respective units.
 *
 * @coverage
 * - Verifies rendering of:
 *   - ProductDetails section
 *   - Price section
 * - Ensures the component tree is wrapped with ProductContextProvider
 * - Validates layout classes for Content and Flex containers
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Product from '../../pages/Product';

/**
 * @mock ../../components/product
 * @description
 * Mocks child UI components to isolate the Product page.
 * Each mocked component renders a simple identifiable element
 * to enable reliable DOM assertions.
 */
vi.mock('../../components/product', () => ({
    ProductDetails: () => <div data-testid="product-details">ProductDetails</div>,
    Price: () => <div data-testid="price">Price</div>,
}));

/**
 * @mock ../../contexts/ProductContext
 * @description
 * Mocks ProductContextProvider to validate that the page correctly
 * wraps its content without depending on the actual context implementation.
 *
 * The mocked provider renders children within a test container.
 */
vi.mock('../../contexts/ProductContext', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="provider">{children}</div>
    ),
}));

/**
 * @suite Product Page
 * @description
 * Validates the compositional structure, provider integration,
 * and layout configuration of the Product page component.
 */
describe('Product Page', () => {
    /**
     * @hook beforeEach
     * @description
     * Clears all mock states before each test to ensure isolation
     * and prevent cross-test interference.
     */
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * @test
     * @name should render all sections
     * @description
     * Verifies that all primary UI sections are rendered within the page.
     *
     * @expect
     * - ProductDetails component is present in the DOM
     * - Price component is present in the DOM
     */
    it('should render all sections', () => {
        render(<Product />);

        expect(screen.getByTestId('product-details')).toBeInTheDocument();
        expect(screen.getByTestId('price')).toBeInTheDocument();
    });

    /**
     * @test
     * @name should wrap content with ProductContextProvider
     * @description
     * Ensures that the page content is wrapped with the ProductContextProvider,
     * confirming correct context integration.
     *
     * @expect
     * - Provider container exists in the DOM
     * - ProductDetails and Price are rendered within the provider
     */
    it('should wrap content with ProductContextProvider', () => {
        render(<Product />);

        const provider = screen.getByTestId('provider');

        expect(provider).toBeInTheDocument();
        expect(provider).toContainElement(screen.getByTestId('product-details'));
        expect(provider).toContainElement(screen.getByTestId('price'));
    });

    /**
     * @test
     * @name should apply correct layout classes
     * @description
     * Validates that the layout containers apply the expected utility classes
     * for spacing and responsive structure.
     *
     * @expect
     * - Content container has class "my-6"
     * - Flex container has classes:
     *   "w-full gap-3 flex-col xl:flex-row justify-between"
     */
    it('should apply correct layout classes', () => {
        const { container } = render(<Product />);

        const content = container.querySelector('.my-6');
        const flex = container.querySelector(
            '.w-full.gap-3.flex-col.xl\\:flex-row.justify-between'
        );

        expect(content).toBeInTheDocument();
        expect(flex).toBeInTheDocument();
    });
});

/**
 * @file Category.test.tsx
 * @module CategoryPageTests
 * @description
 * Unit tests for the Category page component.
 *
 * This test suite validates the page-level responsibilities of the Category page,
 * ensuring correct composition, layout, and provider integration while isolating
 * dependencies such as child components and context logic.
 *
 * @remarks
 * - Child components are mocked to focus only on page composition.
 * - Context provider is mocked to validate structural wrapping without testing its internal logic.
 * - No business logic is tested here; such logic belongs to individual component or hook tests.
 *
 * @coverage
 * - Verifies rendering of all major sections:
 *   - Header
 *   - SearchNSort
 *   - ProductCards
 * - Ensures the component tree is wrapped by CategoryPageProvider
 * - Confirms layout structure and applied utility classes
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Category from '../../pages/Category';

/**
 * @mock @src/domains/dashboard/softwares/components/category
 * @description
 * Mocks all child UI components to isolate Category page behavior.
 * Each mocked component renders a simple identifiable element.
 */
vi.mock('@src/domains/dashboard/softwares/components/category', () => ({
    Header: () => <div data-testid="header">Header</div>,
    SearchNSort: () => <div data-testid="search-sort">SearchNSort</div>,
    ProductCards: () => <div data-testid="product-cards">ProductCards</div>,
}));

/**
 * @mock ../../contexts/CategoryPageContext
 * @description
 * Mocks CategoryPageProvider to verify that the page correctly wraps
 * its children without depending on actual context implementation.
 *
 * The mock provider renders children inside a container with a test identifier.
 */
vi.mock('../../contexts/CategoryPageContext', () => ({
    CategoryPageProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="provider">{children}</div>
    ),
}));

/**
 * @suite Category Page
 * @description
 * Test suite validating the structural and compositional integrity
 * of the Category page component.
 */
describe('Category Page', () => {
    /**
     * @hook beforeEach
     * @description
     * Clears all mock states before each test to ensure test isolation.
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
     * - Header is present
     * - SearchNSort is present
     * - ProductCards is present
     */
    it('should render all sections', () => {
        render(<Category />);

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('search-sort')).toBeInTheDocument();
        expect(screen.getByTestId('product-cards')).toBeInTheDocument();
    });

    /**
     * @test
     * @name should wrap content with CategoryPageProvider
     * @description
     * Ensures that the Category page content is wrapped inside the
     * CategoryPageProvider, confirming correct context integration.
     *
     * @expect
     * - Provider container is rendered
     * - All child components exist within the provider
     */
    it('should wrap content with CategoryPageProvider', () => {
        render(<Category />);

        const provider = screen.getByTestId('provider');

        expect(provider).toBeInTheDocument();
        expect(provider).toContainElement(screen.getByTestId('header'));
        expect(provider).toContainElement(screen.getByTestId('search-sort'));
        expect(provider).toContainElement(screen.getByTestId('product-cards'));
    });

    /**
     * @test
     * @name should apply correct layout classes
     * @description
     * Validates that the layout container includes the expected
     * utility classes for spacing and positioning.
     *
     * @expect
     * - Element with classes "mb-20 pt-9" exists in the DOM
     */
    it('should apply correct layout classes', () => {
        const { container } = render(<Category />);

        const layout = container.querySelector('.mb-20.pt-9');

        expect(layout).toBeInTheDocument();
    });
});

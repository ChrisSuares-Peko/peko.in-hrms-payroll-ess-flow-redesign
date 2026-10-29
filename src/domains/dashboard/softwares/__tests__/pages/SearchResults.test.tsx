/**
 * @file SearchResults.test.tsx
 * @description Unit tests for SearchResults page component
 *
 * Coverage:
 *  - Renders all child sections (Header, Search, ProductCards)
 *  - Ensures content is wrapped with SearchPageProvider
 *  - Verifies layout structure and applied classes
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SearchResults from '../../pages/SearchResults';

/**
 * Mock child components
 */
vi.mock('../../components/searchResults', () => ({
    Header: () => <div data-testid="header">Header</div>,
    ProductCards: () => <div data-testid="product-cards">ProductCards</div>,
}));

vi.mock('../../components/searchResults/sections/Search', () => ({
    default: () => <div data-testid="search">Search</div>,
}));

/**
 * Mock provider (DOM-based, not function-based)
 */
vi.mock('../../contexts/SearchPageContext', () => ({
    SearchPageProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="provider">{children}</div>
    ),
}));

describe('SearchResults Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render all sections', () => {
        render(<SearchResults />);

        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('search')).toBeInTheDocument();
        expect(screen.getByTestId('product-cards')).toBeInTheDocument();
    });

    it('should wrap content with SearchPageProvider', () => {
        render(<SearchResults />);

        const provider = screen.getByTestId('provider');

        expect(provider).toBeInTheDocument();
        expect(provider).toContainElement(screen.getByTestId('header'));
        expect(provider).toContainElement(screen.getByTestId('search'));
        expect(provider).toContainElement(screen.getByTestId('product-cards'));
    });

    it('should apply correct layout classes', () => {
        const { container } = render(<SearchResults />);

        const layout = container.querySelector('.my-6.flex.flex-col.gap-4');

        expect(layout).toBeInTheDocument();
    });
});

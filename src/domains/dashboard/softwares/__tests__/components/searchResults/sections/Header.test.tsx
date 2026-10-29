/**
 * @file Header.test.tsx
 * @description Unit tests for searchResults Header component
 * Verifies:
 *  - Renders the search query in the heading
 *  - Renders results count when not loading
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Header from '@src/domains/dashboard/softwares/components/searchResults/sections/Header';
import { useSearchResultContext } from '@src/domains/dashboard/softwares/contexts/SearchPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SearchPageContext', () => ({
    useSearchResultContext: vi.fn(),
}));

const mockedUseSearchResultContext = vi.mocked(useSearchResultContext);

describe('searchResults Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the search query', () => {
        mockedUseSearchResultContext.mockReturnValue({
            query: 'accounting',
            productsCount: 5,
            isLoading: false,
        } as any);
        render(<Header />);
        expect(screen.getByText(/accounting/)).toBeInTheDocument();
    });

    it('should render results count when not loading', () => {
        mockedUseSearchResultContext.mockReturnValue({
            query: 'crm',
            productsCount: 10,
            isLoading: false,
        } as any);
        render(<Header />);
        expect(screen.getByText(/10 results found/)).toBeInTheDocument();
    });

    it('should not render results count when loading', () => {
        mockedUseSearchResultContext.mockReturnValue({
            query: 'crm',
            productsCount: 10,
            isLoading: true,
        } as any);
        render(<Header />);
        expect(screen.queryByText(/results found/)).not.toBeInTheDocument();
    });
});

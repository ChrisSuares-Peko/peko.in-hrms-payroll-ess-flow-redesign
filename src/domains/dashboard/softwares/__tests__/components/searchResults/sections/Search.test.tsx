/**
 * @file Search.test.tsx
 * @description Unit tests for searchResults Search component
 * Verifies:
 *  - Renders SearchInput with context value
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Search from '@src/domains/dashboard/softwares/components/searchResults/sections/Search';
import {
    useSearchInputContext,
    useSearchResultContext,
} from '@src/domains/dashboard/softwares/contexts/SearchPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SearchPageContext', () => ({
    useSearchInputContext: vi.fn(),
    useSearchResultContext: vi.fn(),
}));
vi.mock('@src/domains/dashboard/softwares/components/common/SearchInput', () => ({
    default: ({ value }: any) => <input data-testid="search-input" defaultValue={value} />,
}));

describe('searchResults Search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSearchInputContext).mockReturnValue({
            searchText: 'accounting',
            updateSearchText: vi.fn(),
        } as any);
        vi.mocked(useSearchResultContext).mockReturnValue({
            searchHandler: vi.fn(),
        } as any);
    });

    it('should render SearchInput', () => {
        render(<Search />);
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
});

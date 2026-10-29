/**
 * @file SearchNSort.test.tsx
 * @description Unit tests for category SearchNSort component
 * Verifies:
 *  - Renders nothing when loading
 *  - Renders SearchInput and SortSelect when not loading
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SearchNSort from '../../../../components/category/sections/SearchNSort';
import { useCategoryPageContext } from '../../../../contexts/CategoryPageContext';

vi.mock('../../../../contexts/CategoryPageContext', () => ({
    useCategoryPageContext: vi.fn(),
}));

vi.mock('../../../../components/common/SearchInput', () => ({
    default: ({ value }: any) => <input data-testid="search-input" value={value} readOnly />,
}));

vi.mock('../../../../components/common/SortSelect', () => ({
    default: () => <div data-testid="sort-select" />,
}));

const mockedUseCategoryPageContext = vi.mocked(useCategoryPageContext);

describe('category SearchNSort', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render inputs when loading', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            searchText: '',
            updateSearchText: vi.fn(),
            handleSearch: vi.fn(),
            filters: { sort: 'asc' },
            sortList: [],
            isLoading: true,
            handleSort: vi.fn(),
        } as any);

        render(<SearchNSort />);
        expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sort-select')).not.toBeInTheDocument();
    });

    it('should render SearchInput and SortSelect when not loading', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            searchText: 'test',
            updateSearchText: vi.fn(),
            handleSearch: vi.fn(),
            filters: { sort: 'asc' },
            sortList: [{ label: 'A-Z', value: 'asc' }],
            isLoading: false,
            handleSort: vi.fn(),
        } as any);

        render(<SearchNSort />);
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });
});

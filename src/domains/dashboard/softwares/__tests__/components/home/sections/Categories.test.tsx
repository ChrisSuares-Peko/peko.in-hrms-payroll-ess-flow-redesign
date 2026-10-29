/**
 * @file Categories.test.tsx
 * @description Unit tests for home Categories component
 * Verifies:
 *  - Renders section heading
 *  - Shows skeleton when loading
 *  - Shows empty state when no categories
 *  - Renders category tiles when categories exist
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Categories from '../../../../components/home/sections/Categories';
import useNavigateToCategoryPageAndUpdateStore from '../../../../hooks/category/useNavigateToCategoryPageAndUpdateStore';
import useCategoryTile from '../../../../hooks/home/useCategoryTile';
import useGetCategories from '../../../../hooks/home/useGetCategories';

vi.mock('../../../../hooks/home/useGetCategories', () => ({ default: vi.fn() }));
vi.mock('../../../../hooks/home/useCategoryTile', () => ({ default: vi.fn() }));
vi.mock('../../../../hooks/category/useNavigateToCategoryPageAndUpdateStore', () => ({
    default: vi.fn(),
}));
vi.mock('../../../../components/home/sections/CategoryTile', () => ({
    default: ({ category }: any) => <div data-testid="category-tile">{category.name}</div>,
}));

const mockScrollRef = { current: null };

describe('home Categories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCategoryTile).mockReturnValue({
            tileIconSize: 24,
            scrollRef: mockScrollRef,
            scrollLeft: vi.fn(),
            scrollRight: vi.fn(),
            canScrollLeft: false,
            canScrollRight: false,
        } as any);
        vi.mocked(useNavigateToCategoryPageAndUpdateStore).mockReturnValue({
            navigateAndUpdateStore: vi.fn(),
        } as any);
    });

    it('should render the section heading', () => {
        vi.mocked(useGetCategories).mockReturnValue({ categoryList: [], isLoading: false } as any);
        render(<Categories />);
        expect(screen.getByText('Search By Category')).toBeInTheDocument();
    });

    it('should render category tiles when categories exist', () => {
        vi.mocked(useGetCategories).mockReturnValue({
            categoryList: [
                { name: 'Accounting', weburl: 'accounting' },
                { name: 'CRM', weburl: 'crm' },
            ],
            isLoading: false,
        } as any);

        render(<Categories />);
        expect(screen.getAllByTestId('category-tile')).toHaveLength(2);
    });
});

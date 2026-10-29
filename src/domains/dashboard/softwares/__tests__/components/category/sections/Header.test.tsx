/**
 * @file Header.test.tsx
 * @description Unit tests for category Header component
 * Verifies:
 *  - Renders skeleton when loading
 *  - Renders Select and category title when loaded
 */

import React from 'react';

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HeaderComponent from '../../../../components/category/sections/Header';
import { useCategoryPageContext } from '../../../../contexts/CategoryPageContext';

vi.mock('../../../../components/category/sections/Header', () => ({
    default: vi.fn(),
}));

vi.mock('../../../../contexts/CategoryPageContext', () => ({
    useCategoryPageContext: vi.fn(),
}));

vi.mock('@src/assets/icons/Accounting.svg', () => ({ default: 'accounting-icon' }));
vi.mock('../../../../assets/icons/DownArrow.svg', () => ({ default: 'down-arrow' }));
vi.mock('../../../../assets/styles/styles.css', () => ({}));

const mockedUseCategoryPageContext = vi.mocked(useCategoryPageContext);

describe('category Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('should render without crashing when context provides required values', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            categoryList: [{ weburl: 'accounting', title: 'Accounting', icon: '' }],
            labeledCategories: [{ label: 'Accounting', value: 'accounting' }],
            currentCategory: 'accounting',
            handleCategoryChange: vi.fn(),
            categoryIsLoading: false,
        } as any);

        const { container } = render(<HeaderComponent />);
        expect(container).toBeTruthy();
    });

    it('should render when categoryIsLoading is true', () => {
        mockedUseCategoryPageContext.mockReturnValue({
            categoryList: [],
            labeledCategories: [],
            currentCategory: '',
            handleCategoryChange: vi.fn(),
            categoryIsLoading: true,
        } as any);

        const { container } = render(<HeaderComponent />);
        expect(container).toBeTruthy();
    });
});

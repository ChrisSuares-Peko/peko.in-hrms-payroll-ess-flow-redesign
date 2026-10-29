import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';

import Categories from '../../components/SubscriptionListing/Categories';
import { categories } from '../../types/types';

describe('Categories Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        cleanup();
    });
    const mockSetSelectedCategory = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mockSetSelectedCategoryName = vi.fn();
    const mockCategories: categories[] = [
        {
            id: 1,
            categoryName: 'Category 1',
            categoryImage: 'image1.png',
            categoryStatus: 'true',
            createdAt: '2023-02-22 05:43:57',
            updatedAt: '2023-02-22 05:43:57',
            vendor: { id: 1, vendorName: 'string' },
            vendorId: 1,
        },
        {
            id: 2,
            categoryName: 'example category',
            categoryImage: 'image2.png',
            categoryStatus: 'true',
            createdAt: '2023-02-22 05:43:57',
            updatedAt: '2023-02-22 05:43:57',
            vendor: { id: 1, vendorName: 'string' },
            vendorId: 1,
        },
    ];
    test('renders skeleton loader when isLoading is true', () => {
        const { container } = render(
            <Categories
                category={[]}
                isLoading
                selectedCategory={null}
                setSelectedCategory={mockSetSelectedCategory}
            />
        );
        const skeletonLoader = container.querySelector('.ant-skeleton');
        expect(skeletonLoader).toBeInTheDocument();
    });

    test('renders Empty component when category is empty and isLoading is false', () => {
        render(
            <Categories
                category={[]}
                isLoading={false}
                selectedCategory={null}
                setSelectedCategory={mockSetSelectedCategory}
            />
        );
        expect(screen.getByTestId('categories-skeleton')).toBeInTheDocument();
    });

    test('renders categories correctly when category data is provided', () => {
        render(
            <Categories
                category={mockCategories}
                isLoading={false}
                selectedCategory={1}
                setSelectedCategory={mockSetSelectedCategory}
            />
        );
        expect(screen.getByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Example Category')).toBeInTheDocument();
    });

    test('handles click on category correctly', () => {
        render(
            <Categories
                category={mockCategories}
                isLoading={false}
                selectedCategory={null}
                setSelectedCategory={mockSetSelectedCategory}
            />
        );
        // Simulate click on category
        fireEvent.click(screen.getByText('Category 1'));

        // Check if mock functions are called with correct arguments
        expect(mockSetSelectedCategory).toHaveBeenCalledWith(1);
        // expect(mockSetSelectedCategoryName).toHaveBeenCalledWith('Category 1');
    });

    test('handles click on "All Categories" button correctly', () => {
        render(
            <Categories
                category={mockCategories}
                isLoading={false}
                selectedCategory={1}
                setSelectedCategory={mockSetSelectedCategory}
            />
        );
        // Simulate click on "All Categories"
        fireEvent.click(screen.getByText('All'));

        expect(mockSetSelectedCategory).toHaveBeenCalledWith(null);
        // expect(mockSetSelectedCategoryName).toHaveBeenCalledWith('All Categories');
    });

    test('toTitleCase function formats string correctly in rendering', () => {
        render(
            <Categories
                category={mockCategories}
                isLoading={false}
                selectedCategory={null}
                setSelectedCategory={vi.fn()}
            />
        );

        // Check if the category name is rendered in title case
        const categoryText = screen.getByText('Example Category');
        expect(categoryText).toBeInTheDocument();
    });
});

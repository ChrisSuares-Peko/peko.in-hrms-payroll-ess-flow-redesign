import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

import BDocsCategoryCards from '@src/domains/dashboard/BusinessDocs/components/BDocsCategoryCards';
import { categoryCard } from '@src/domains/dashboard/BusinessDocs/types/type';
import { paths } from '@src/routes/paths';

vi.mock('antd', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        Card: ({
            children,
            bordered,
            loading,
            ...props
        }: {
            children?: React.ReactNode;
            bordered?: boolean;
            loading?: boolean;
            [key: string]: unknown;
        }) => (
            <div
                {...props}
                data-testid="mock-card"
                className={`${bordered ? 'bordered' : ''} ${loading ? 'ant-card-loading' : ''}`}
            >
                {children}
            </div>
        ),
        Image: vi.fn(() => <div data-testid="mock-image" />),
    };
});

describe('BDocsCategoryCards Component', () => {
    const defaultProps: categoryCard = {
        icon: 'test-icon.png',
        category: 'Test Category',
        size: 5,
        loading: false,
    };

    it('renders the card with the correct category and size', () => {
        render(
            <MemoryRouter>
                <BDocsCategoryCards {...defaultProps} />
            </MemoryRouter>
        );

        const categoryText = screen.getByText('Test Category');
        expect(categoryText).toBeInTheDocument();

        const sizeText = screen.getByText('5 Files');
        expect(sizeText).toBeInTheDocument();
    });

    it('renders "No Data Available" when size is 0', () => {
        render(
            <MemoryRouter>
                <BDocsCategoryCards {...defaultProps} size={0} />
            </MemoryRouter>
        );

        const noDataText = screen.getByText('No Data Available');
        expect(noDataText).toBeInTheDocument();
    });

    it('renders the loading state correctly', () => {
        render(
            <MemoryRouter>
                <BDocsCategoryCards {...defaultProps} loading />
            </MemoryRouter>
        );

        const loadingCard = screen.getByTestId('mock-card');
        expect(loadingCard).toHaveClass('ant-card-loading');
    });

    it('renders the image with the correct source', () => {
        render(
            <MemoryRouter>
                <BDocsCategoryCards {...defaultProps} />
            </MemoryRouter>
        );

        const imageElement = screen.getByTestId('mock-image');
        expect(imageElement).toBeInTheDocument();
    });

    it('links to the correct path with category in state', () => {
        render(
            <MemoryRouter>
                <BDocsCategoryCards {...defaultProps} />
            </MemoryRouter>
        );

        const linkElement = screen.getByRole('link');
        expect(linkElement).toHaveAttribute('href', `/${paths.businessDocs.category}`);
    });
});

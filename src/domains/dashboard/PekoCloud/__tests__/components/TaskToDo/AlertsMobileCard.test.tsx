import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import AlertsMobileCard from '../../../components/TaskToDo/AlertsMobileCard';

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('AlertsMobileCard', () => {
    const mockItem = {
        title: 'Test Title',
        date: '2024-01-01',
        type: 'FLEETS',
        status: 'Active',
        actions: '',
    };

    const navigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(navigate);
    });

    it('renders correctly with the provided item data', () => {
        render(<AlertsMobileCard item={mockItem} />, { wrapper: MemoryRouter });

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(<AlertsMobileCard item={mockItem} />, { wrapper: MemoryRouter });

        // Initially, additional details should not be visible
        expect(screen.queryByText(/Update/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Additional details should now be visible
        expect(screen.getByText(/Update/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Additional details should be hidden
        expect(screen.queryByText(/Update/i)).not.toBeInTheDocument();
    });

    it('calls navigate with the correct path based on item type when "Update" button is clicked', () => {
        render(<AlertsMobileCard item={mockItem} />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(`/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`);
    });

    it('calls navigate with the correct path when the item type is "ASSETS"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'ASSETS' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`
        );
    });

    it('calls navigate with the correct path when the item type is "COMPANY_DOCS"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'COMPANY_DOCS' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`
        );
    });

    it('calls navigate with the correct path when the item type is "FINANCIAL_DOCS"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'FINANCIAL_DOCS' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
            { state: { tab: '3' } }
        );
    });

    it('calls navigate with the correct path when the item type is "OWNERS_DOCS"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'OWNERS_DOCS' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`
        );
    });

    it('calls navigate with the correct path when the item type is "CHEQUE_LEAVES"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'CHEQUE_LEAVES' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
            { state: { tab: '1' } }
        );
    });

    it('calls navigate with the correct path when the item type is "SUBSCRIPTIONS"', () => {
        render(<AlertsMobileCard item={{ ...mockItem, type: 'SUBSCRIPTIONS' }} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        fireEvent.click(screen.getByText('Update'));

        expect(navigate).toHaveBeenCalledWith(
            `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`
        );
    });
});

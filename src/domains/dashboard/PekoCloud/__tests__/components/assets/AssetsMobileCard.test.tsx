import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import AssetsMobileCard from '../../../components/Assets/AssetsMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('AssetsMobileCard', () => {
    const mockItem = {
        assetName: 'Test Asset',
        assetCategory: 'Category A',
        usedBy: 'John Doe',
        serialNumber: 'SN123456',
        purchasedDate: '2023-01-01',
        assetType: 1,
        warranty: '2 years',
        status: 'Active',
        amount: '1000',
        id: '1',
        actions: '',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatDate as any).mockImplementation((date: any) => new Date(date).toLocaleDateString());
        (formatNumberWithLocalString as any).mockImplementation((amount: any) =>
            parseFloat(amount).toLocaleString()
        );
    });

    it('renders correctly with the provided item data', () => {
        render(
            <AssetsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Test Asset')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Category A')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('SN123456')).not.toBeInTheDocument();
        expect(screen.queryByText('1/1/2023')).not.toBeInTheDocument();
        expect(screen.queryByText('2 years')).not.toBeInTheDocument();
        expect(screen.queryByText('AED 1,000')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <AssetsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Asset Category/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Serial No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Purchased Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Asset Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Warranty/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Asset Category/i)).toBeInTheDocument();
        expect(screen.getByText(/Assigned to/i)).toBeInTheDocument();
        expect(screen.getByText(/Serial No/i)).toBeInTheDocument();
        expect(screen.getByText(/Purchased Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Asset Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Warranty/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Asset Category/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Serial No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Purchased Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Asset Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Warranty/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <AssetsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );

        // Show details first
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('shows the correct color class based on status', () => {
        render(
            <AssetsMobileCard
                item={{ ...mockItem, status: 'Active' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Active')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        render(
            <AssetsMobileCard
                item={{ ...mockItem, status: 'Expired' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Expired')).toHaveClass('text-[#FDA700] bg-[#FFFBE4]');
    });

    it('calls formatDate correctly for purchasedDate', () => {
        render(
            <AssetsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );

        expect(formatDate).toHaveBeenCalledWith('2023-01-01');
    });

    it('calls formatNumberWithLocalString correctly for amount', () => {
        render(
            <AssetsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1000');
    });
});

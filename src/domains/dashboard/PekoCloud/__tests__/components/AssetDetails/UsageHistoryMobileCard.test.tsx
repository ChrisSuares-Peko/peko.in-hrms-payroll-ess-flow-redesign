import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsageHistoryMobileCard from '../../../components/AssetDetails/UsageHistoryMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('UsageHistoryMobileCard', () => {
    const mockItem = {
        employee: 'John Doe',
        returnStatus: 'Returned',
        assignDate: '2024-01-01',
        returnDate: '2024-06-01',
        remarks: 'Item returned in good condition',
        status: '',
        actions: '',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with the provided item data', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Returned')).toBeInTheDocument();
        expect(screen.queryByText('2024-01-01')).not.toBeInTheDocument();
        expect(screen.queryByText('2024-06-01')).not.toBeInTheDocument();
        expect(screen.queryByText('Item returned in good condition')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Assigned Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Returned Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Return Status/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Remarks/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Assigned Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Returned Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Return Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Remarks/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Assigned Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Returned Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Return Status/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Remarks/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEdit when edit button is clicked', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls formatDate correctly for assignDate and returnDate', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2024-01-01');
        expect(formatDate).toHaveBeenCalledWith('2024-06-01');
    });

    it('renders "N/A" for missing dates or details', () => {
        const incompleteItem = {
            ...mockItem,
            assignDate: '',
            returnDate: '',
            returnStatus: '',
            remarks: '',
        };

        render(
            <UsageHistoryMobileCard
                item={incompleteItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));
        screen.debug(undefined, 10000);

        const results = screen.getAllByText('N/A');
        expect(results.length).toBe(5);
    });
});

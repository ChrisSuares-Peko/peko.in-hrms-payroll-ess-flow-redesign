import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsageHistoryMobileCard from '../../../components/FleetManagement/UsageHistoryMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('UsageHistoryMobileCard', () => {
    const mockItem = {
        employee: 'John Doe',
        returnStatus: 'Returned',
        assignDate: '2024-08-01',
        returnDate: '2024-08-15',
        remarks: 'No issues',
        status: 'Completed',
        actions: '',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatDate as any).mockImplementation((date: any) => date.split('T')[0]);
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
        expect(screen.queryByText('Assign Date :')).not.toBeInTheDocument();
        expect(screen.queryByText('Return Date :')).not.toBeInTheDocument();
        expect(screen.queryByText('Return Status :')).not.toBeInTheDocument();
        expect(screen.queryByText('Remarks :')).not.toBeInTheDocument();
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
        expect(screen.queryByText(/Assign Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Return Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Return Status/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Remarks/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Assign Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Return Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Return Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Remarks/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Assign Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Return Date/i)).not.toBeInTheDocument();
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

    it('formats dates correctly', () => {
        render(
            <UsageHistoryMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2024-08-01');
        expect(formatDate).toHaveBeenCalledWith('2024-08-15');
    });
});

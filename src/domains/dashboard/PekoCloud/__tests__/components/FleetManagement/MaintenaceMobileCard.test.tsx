import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import MaintenanceMobileCard from '../../../components/FleetManagement/MaintenaceMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('MaintenanceMobileCard', () => {
    const mockItem = {
        dateAndTime: '2024-08-30T12:00:00Z',
        repairCategory: 'Engine',
        serviceType: 'Oil Change',
        dateReceived: '2024-08-28',
        status: 'Completed',
        actions: '',
        amount: '1234.56',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatDate as any).mockImplementation((date: any) => date.split('T')[0]);
        (formatNumberWithLocalString as any).mockImplementation((amount: any) => amount);
    });

    it('renders correctly with the provided item data', () => {
        render(
            <MaintenanceMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(screen.getByText('2024-08-30')).toBeInTheDocument();
        expect(screen.getByText('Engine')).toBeInTheDocument();
        expect(screen.queryByText('Service Type :')).not.toBeInTheDocument();
        expect(screen.queryByText('Date Received :')).not.toBeInTheDocument();
        expect(screen.queryByText('Amount :')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <MaintenanceMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Service Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Date Received/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Service Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Date Received/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Service Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Date Received/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <MaintenanceMobileCard
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
            <MaintenanceMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('formats date and amount correctly', () => {
        render(
            <MaintenanceMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2024-08-30T12:00:00Z');
        expect(formatDate).toHaveBeenCalledWith('2024-08-28');
        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1234.56');
    });
});

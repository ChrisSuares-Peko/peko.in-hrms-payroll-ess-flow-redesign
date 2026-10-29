import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import FleetMobilecard from '../../../components/fleet/FleetMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('FleetMobilecard', () => {
    const mockItem = {
        vehicleName: 'Test Vehicle',
        vehicleType: 'Type A',
        usedBy: 'John Doe',
        vehicleNumber: 'VN123456',
        purchasedDate: '2023-01-01',
        assetType: 1,
        dateOfRenewal: '2024-01-01',
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
            <FleetMobilecard item={mockItem} handleDelete={handleDelete} handleEdit={handleEdit} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Test Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Type A')).not.toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('VN123456')).not.toBeInTheDocument();
        expect(screen.queryByText('1/1/2023')).not.toBeInTheDocument();
        expect(screen.queryByText('1/1/2024')).not.toBeInTheDocument();
        expect(screen.queryByText('AED 1,000')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <FleetMobilecard item={mockItem} handleDelete={handleDelete} handleEdit={handleEdit} />,
            { wrapper: MemoryRouter }
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Vehicle Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Vehicle Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Purchased Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Asset Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Registration Renewal Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Vehicle Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Assigned to/i)).toBeInTheDocument();
        expect(screen.getByText(/Vehicle Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Purchased Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Asset Type/i)).toBeInTheDocument();
        expect(screen.getByText(/Registration Renewal Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Vehicle Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Vehicle Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Purchased Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Asset Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Registration Renewal Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <FleetMobilecard item={mockItem} handleDelete={handleDelete} handleEdit={handleEdit} />,
            { wrapper: MemoryRouter }
        );

        // Show details first
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('shows the correct color class based on status', () => {
        render(
            <FleetMobilecard
                item={{ ...mockItem, status: 'Active' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Active')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        render(
            <FleetMobilecard
                item={{ ...mockItem, status: 'Expired' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Expired')).toHaveClass('text-[#FDA700] bg-[#FFFBE4]');
    });

    it('calls formatDate correctly for purchasedDate and dateOfRenewal', () => {
        render(
            <FleetMobilecard item={mockItem} handleDelete={handleDelete} handleEdit={handleEdit} />,
            { wrapper: MemoryRouter }
        );

        expect(formatDate).toHaveBeenCalledWith('2023-01-01');
        expect(formatDate).toHaveBeenCalledWith('2024-01-01');
    });

    it('calls formatNumberWithLocalString correctly for amount', () => {
        render(
            <FleetMobilecard item={mockItem} handleDelete={handleDelete} handleEdit={handleEdit} />,
            { wrapper: MemoryRouter }
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1000');
    });
});

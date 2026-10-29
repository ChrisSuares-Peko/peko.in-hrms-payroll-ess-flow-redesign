import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChequeLeafMobileCard from '../../../components/Financials/AdaptiveView/ChequeLeafMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('ChequeLeafMobileCard', () => {
    const mockItem = {
        chequeBookNumber: '123',
        type: 'Type A',
        payeeName: 'John Doe',
        bankAccount: '123456789',
        chequeNumber: '0001',
        dateOfCheque: '2024-01-01',
        dueDate: '2025-01-01',
        status: 'Cleared',
        actions: '',
        amount: '1000',
        document: 'test.pdf',
        documentAvailability: 'Available',
        id: '1',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockReturnValue('1,000');
        (formatDate as any).mockImplementation((date: string | number | Date) =>
            new Date(date).toLocaleDateString()
        );
    });

    it('renders correctly with the provided item data', () => {
        render(
            <ChequeLeafMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('Cleared')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('AED 1,000')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <ChequeLeafMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Payee Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Account No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Payee Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Account No/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Payee Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Account No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls formatNumberWithLocalString correctly for amount', () => {
        render(
            <ChequeLeafMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1000');
    });

    it('calls formatDate correctly for dateOfCheque and dueDate', () => {
        render(
            <ChequeLeafMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2024-01-01');
        expect(formatDate).toHaveBeenCalledWith('2025-01-01');
    });

    it('applies correct color class based on status', () => {
        // Test for 'Cleared' status
        render(
            <ChequeLeafMobileCard
                item={{ ...mockItem, status: 'Cleared' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );
        expect(screen.getByText('Cleared')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        // Test for 'Issued' status
        render(
            <ChequeLeafMobileCard
                item={{ ...mockItem, status: 'Issued' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );
        expect(screen.getByText('Issued')).toHaveClass('text-[#007BFF] bg-[#E0F3FF]');

        // Test for 'Presented' status
        render(
            <ChequeLeafMobileCard
                item={{ ...mockItem, status: 'Presented' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );
        expect(screen.getByText('Presented')).toHaveClass('text-[#007BFF] bg-[#E0F3FF]');
    });
});

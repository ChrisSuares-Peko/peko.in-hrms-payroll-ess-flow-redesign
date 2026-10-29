import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChequeBooksMobileCard from '../../../components/Financials/AdaptiveView/ChequeBooksMobileCard';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('ChequeBooksMobileCard', () => {
    const mockItem = {
        bookId: '123',
        accountName: 'Test Account',
        accountNumber: '456789',
        bankName: 'Test Bank',
        accountBalance: '1000',
        dateOfCheque: '2024-01-01',
        dueDate: '2025-01-01',
        status: 'Active',
        actions: '',
        amount: '1000',
        document: 'test.pdf',
        documentAvailability: 'Available',
        id: '1',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();
    const handleDocDownload = vi.fn();
    const loadingRows = {};

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockReturnValue('1,000');
    });

    it('renders correctly with the provided item data', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Test Account')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Bank')).not.toBeInTheDocument();
        expect(screen.queryByText('AED 1,000')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Account Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Account Balance/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Account Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Account Balance/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Account Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Account Balance/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEdit when edit button is clicked', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        screen.debug(undefined, 10000);

        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleDocDownload when download button is clicked and is not disabled', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('button', { name: /download/i }));
        expect(handleDocDownload).toHaveBeenCalledWith(mockItem);
    });

    it('does not call handleDocDownload when download button is disabled', () => {
        render(
            <ChequeBooksMobileCard
                item={{ ...mockItem, documentAvailability: 'NA' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('button', { name: /download/i }));
        expect(handleDocDownload).not.toHaveBeenCalled();
    });

    it('shows loading spinner on download button when loading', () => {
        const loadingRowsWithId = { '1': true };
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRowsWithId}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        const downloadButton = screen.getByRole('button', { name: '' });
        expect(downloadButton.querySelector('.ant-spin')).toBeInTheDocument();
        expect(downloadButton.querySelector('.ant-spin-dot')).toBeInTheDocument();
        expect(downloadButton.querySelector('svg[data-icon="download"]')).not.toBeInTheDocument();
    });

    it('applies correct color class based on status', () => {
        // Test for 'Active' status
        render(
            <ChequeBooksMobileCard
                item={{ ...mockItem, status: 'Active' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Active')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        // Test for 'Issued' status
        render(
            <ChequeBooksMobileCard
                item={{ ...mockItem, status: 'Issued' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Issued')).toHaveClass('text-[#007BFF] bg-[#E0F3FF]');

        // Test for 'Expired' status
        render(
            <ChequeBooksMobileCard
                item={{ ...mockItem, status: 'Expired' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Expired')).toHaveClass('text-[#FDA700] bg-[#FFFBE4]');
    });

    it('calls formatNumberWithLocalString correctly for accountBalance', () => {
        render(
            <ChequeBooksMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1000');
    });
});

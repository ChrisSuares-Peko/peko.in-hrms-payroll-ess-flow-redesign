import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChequeManagementMobileCard from '../../../components/Financials/AdaptiveView/ChequeManagementMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('ChequeManagementMobileCard', () => {
    const mockItem = {
        chequeBookNumber: '123',
        type: 'Type A',
        payeeName: 'Test Payee',
        bankAccount: '456789',
        chequeNumber: '789',
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
    const handleDocDownload = vi.fn();
    const loadingRows = {};

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockReturnValue('1,000');
        (formatDate as any).mockImplementation((date: string) => date);
    });

    it('renders correctly with the provided item data', () => {
        render(
            <ChequeManagementMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('Cleared')).toBeInTheDocument();
        expect(screen.queryByText('AED 1,000')).not.toBeInTheDocument();
        expect(screen.queryByText('Type A')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Payee')).not.toBeInTheDocument();
        expect(screen.queryByText('456789')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <ChequeManagementMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Payee Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Account No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Cheque Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Cheque Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Due Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Type :/i)).toBeInTheDocument();
        expect(screen.getByText(/Payee Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Bank Account No/i)).toBeInTheDocument();
        expect(screen.getByText(/Cheque Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Cheque Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Due Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Type/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Payee Name/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Bank Account No/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Cheque Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Cheque Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Due Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <ChequeManagementMobileCard
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
            <ChequeManagementMobileCard
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
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleDocDownload when download button is clicked and is not disabled', () => {
        render(
            <ChequeManagementMobileCard
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
            <ChequeManagementMobileCard
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
            <ChequeManagementMobileCard
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
        // Test for 'Cleared' status
        render(
            <ChequeManagementMobileCard
                item={{ ...mockItem, status: 'Cleared' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Cleared')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        // Test for 'Issued' status
        render(
            <ChequeManagementMobileCard
                item={{ ...mockItem, status: 'Issued' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Issued')).toHaveClass('text-[#007BFF] bg-[#E0F3FF]');

        // Test for 'Presented' status
        render(
            <ChequeManagementMobileCard
                item={{ ...mockItem, status: 'Presented' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />,
            { wrapper: MemoryRouter }
        );
        expect(screen.getByText('Presented')).toHaveClass('text-[#007BFF] bg-[#E0F3FF]');
    });
});

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FleetDocMobileCard from '../../../components/FleetManagement/FleetDocMobileCard';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('FleetDocMobileCard', () => {
    const mockItem = {
        documentName: 'Test Document',
        documentNumber: '123456',
        documentType: 'PDF',
        issueDate: '2024-01-01',
        expireDate: '2025-01-01',
        status: 'Active',
        actions: '',
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
    });

    it('renders correctly with the provided item data', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        expect(screen.getByText('Test Document')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('123456')).not.toBeInTheDocument();
        expect(screen.queryByText('2024-01-01')).not.toBeInTheDocument();
        expect(screen.queryByText('2025-01-01')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Document Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Issued Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Expiry Date/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Document Number/i)).toBeInTheDocument();
        expect(screen.getByText(/Issued Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Expiry Date/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Document Number/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Issued Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Expiry Date/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEdit when edit button is clicked', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleDocDownload when download button is clicked and is not disabled', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('button', { name: /download/i }));
        expect(handleDocDownload).toHaveBeenCalledWith(mockItem);
    });

    it('does not call handleDocDownload when download button is disabled', () => {
        render(
            <FleetDocMobileCard
                item={{ ...mockItem, documentAvailability: 'NA' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('button', { name: /download/i }));
        expect(handleDocDownload).not.toHaveBeenCalled();
    });

    it('shows loading spinner on download button when loading', () => {
        const loadingRowsWithId = { '1': true };
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRowsWithId}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        const downloadButton = screen.getByRole('button', { name: '' });
        expect(downloadButton.querySelector('.ant-spin')).toBeInTheDocument();
        expect(downloadButton.querySelector('.ant-spin-dot')).toBeInTheDocument();
        expect(downloadButton.querySelector('svg[data-icon="download"]')).not.toBeInTheDocument();
    });

    it('applies correct color class based on document status', () => {
        // Test for 'Active' status
        render(
            <FleetDocMobileCard
                item={{ ...mockItem, status: 'Active' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );
        expect(screen.getByText('Active')).toHaveClass('text-[#05BE63] bg-[#DDFFE2]');

        // Test for 'Expired' status
        render(
            <FleetDocMobileCard
                item={{ ...mockItem, status: 'Expired' }}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );
        expect(screen.getByText('Expired')).toHaveClass('text-[#FDA700] bg-[#FFFBE4]');
    });

    it('calls formatDate correctly for issueDate and expireDate', () => {
        render(
            <FleetDocMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleDocDownload={handleDocDownload}
                loadingRows={loadingRows}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2024-01-01');
        expect(formatDate).toHaveBeenCalledWith('2025-01-01');
    });
});

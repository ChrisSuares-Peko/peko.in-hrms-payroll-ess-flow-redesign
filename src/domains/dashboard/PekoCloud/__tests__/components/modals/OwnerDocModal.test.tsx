import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OwnerDocModal from '../../../components/Modals/OwnerDocModal';
import { useUpdateOwnerDoc } from '../../../hooks/ownerDocHooks/useUpdateOwnerDocApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/ownerDocHooks/useUpdateOwnerDocApi', () => ({
    useUpdateOwnerDoc: vi.fn(() => ({
        updateOwnerDoc: vi.fn(),
        submitLoading: false,
    })),
}));

describe('OwnerDocModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <OwnerDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Document Details')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Issued Date')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByText('Document Number')).toBeInTheDocument();
        expect(screen.getByText('Upload Document Copy')).toBeInTheDocument();
    });

    it('calls updateOwnerDoc on form submit when adding a new document', async () => {
        const updateOwnerDoc = vi.fn();
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc,
            submitLoading: false,
        });

        const selectedData = {
            documentType: 'Passport',
        };
        render(
            <OwnerDocModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                selectedData={selectedData}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document number'), {
            target: { value: '123456' },
        });

        // Simulate issue date selection
        const calendarIcons = screen.getAllByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcons[0]);
        fireEvent.click(screen.getByText('Today'));

        // Simulate expiry date selection
        fireEvent.click(calendarIcons[1]);
        fireEvent.click(screen.getAllByText('Today')[1]);

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(updateOwnerDoc).toHaveBeenCalled();
        });
    });

    it('calls updateOwnerDoc when editing an existing record', async () => {
        const updateOwnerDoc = vi.fn();
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc,
            submitLoading: false,
        });

        const selectedData = {
            documentType: 'Passport',
            issueDate: '2024-01-01',
            expireDate: '2024-12-31',
            documentNumber: '123456',
            document: 'document.pdf',
        };

        render(
            <OwnerDocModal
                open
                handleCancel={mockHandleCancel}
                selectedData={selectedData}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document name'), {
            target: { value: 'Updated Document' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() =>
            expect(updateOwnerDoc).toHaveBeenCalledWith(
                {
                    [selectedData.documentType]: expect.objectContaining({
                        documentType: 'Updated Document',
                    }),
                },
                selectedData
            )
        );
    });

    it('renders loading state correctly', () => {
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc: vi.fn(),
            submitLoading: true,
        });

        render(
            <OwnerDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <OwnerDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

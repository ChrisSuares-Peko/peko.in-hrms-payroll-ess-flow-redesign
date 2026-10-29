import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OwnerBankDetailsModal from '../../../components/Modals/OwnerBankDetailsModal';
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

describe('OwnerBankDetailsModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <OwnerBankDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Bank Details')).toBeInTheDocument();
        expect(screen.getByText('Account Holder Name')).toBeInTheDocument();
        expect(screen.getByText('Swift Code')).toBeInTheDocument();
        expect(screen.getByText('IBAN Number')).toBeInTheDocument();
        expect(screen.getByText('Upload Document Copy')).toBeInTheDocument();
    });

    it('calls updateOwnerDoc on form submit when adding new bank details', async () => {
        const updateOwnerDoc = vi.fn();
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc,
            submitLoading: false,
        });

        const selectedData = {
            documentType: 'BankDetails',
        };

        render(
            <OwnerBankDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                selectedData={selectedData}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter account holder name'), {
            target: { value: 'Bank Account' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter swift code'), {
            target: { value: 'SWIFT123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter IBAN'), {
            target: { value: 'AE123456789009876543210' },
        });

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
            documentType: 'BankDetails',
            name: 'Bank Account',
            iban: 'AE123456789009876543210',
            swiftcode: 'SWIFT123',
        };

        render(
            <OwnerBankDetailsModal
                open
                handleCancel={mockHandleCancel}
                selectedData={selectedData}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter account holder name'), {
            target: { value: 'Updated Bank Account' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(updateOwnerDoc).toHaveBeenCalledWith(
                {
                    [selectedData.documentType]: expect.objectContaining({
                        name: 'Updated Bank Account',
                    }),
                },
                selectedData
            );
        });
    });

    it('renders loading state correctly', () => {
        (useUpdateOwnerDoc as any).mockReturnValue({
            updateOwnerDoc: vi.fn(),
            submitLoading: true,
        });

        render(
            <OwnerBankDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <OwnerBankDetailsModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

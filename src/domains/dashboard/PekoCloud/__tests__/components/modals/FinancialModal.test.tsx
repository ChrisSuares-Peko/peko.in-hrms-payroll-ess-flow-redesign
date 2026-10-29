import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FinancialModal from '../../../components/Modals/FinancialModal';
import useFinancialDocCreate from '../../../hooks/financialDocHooks/useCreateFinancialDocApi';
import { useUpdateFinancialDoc } from '../../../hooks/financialDocHooks/useUpdateFinancialDocApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/financialDocHooks/useCreateFinancialDocApi', () => ({
    default: vi.fn(() => ({
        handleFinancialDocCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/financialDocHooks/useUpdateFinancialDocApi', () => ({
    useUpdateFinancialDoc: vi.fn(() => ({
        updateFinancialDetails: vi.fn(),
        submitLoading: false,
    })),
}));

describe('FinancialModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <FinancialModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Document Number')).toBeInTheDocument();
        expect(screen.getByText('Document Type')).toBeInTheDocument();
        expect(screen.getByText('Issued Date')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByText('Upload Document Copy')).toBeInTheDocument();
    });

    it('calls handleFinancialDocCreation on form submit', async () => {
        const handleFinancialDocCreation = vi.fn();
        (useFinancialDocCreate as any).mockReturnValue({
            handleFinancialDocCreation,
            submitLoading: false,
        });

        render(
            <FinancialModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document name'), {
            target: { value: 'Document A' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter document number'), {
            target: { value: '123456' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter document type'), {
            target: { value: 'Type A' },
        });

        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });

        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(handleFinancialDocCreation).toHaveBeenCalled();
        });
    });

    it('calls updateFinancialDetails when editing an existing record', async () => {
        const updateFinancialDetails = vi.fn();
        (useUpdateFinancialDoc as any).mockReturnValue({
            updateFinancialDetails,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            documentName: 'Document A',
            documentNumber: '123456',
            documentType: 'Type A',
            issueDate: '2024-01-01',
            expireDate: '2024-12-31',
            document: 'document.pdf',
        };

        render(
            <FinancialModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document name'), {
            target: { value: 'Updated Document' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() =>
            expect(updateFinancialDetails).toHaveBeenCalledWith(
                expect.objectContaining({ documentName: 'Updated Document' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useFinancialDocCreate as any).mockReturnValue({
            handleFinancialDocCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateFinancialDoc as any).mockReturnValue({
            updateFinancialDetails: vi.fn(),
            submitLoading: true,
        });

        render(
            <FinancialModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <FinancialModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

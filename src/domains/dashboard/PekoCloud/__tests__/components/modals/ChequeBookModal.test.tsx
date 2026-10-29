import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChequeBookModal from '../../../components/Modals/ChequeBookModal';
import useChequeBookCreate from '../../../hooks/financialDocHooks/useCreateChequeBookApi';
import { useUpdateChequeBook } from '../../../hooks/financialDocHooks/useUpdateChequeBookApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/financialDocHooks/useCreateChequeBookApi', () => ({
    default: vi.fn(() => ({
        handleChequeBookCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/financialDocHooks/useUpdateChequeBookApi', () => ({
    useUpdateChequeBook: vi.fn(() => ({
        updateCheqBookDetails: vi.fn(),
        submitLoading: false,
    })),
}));

describe('ChequeBookModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();
    const mockSetRefState = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <ChequeBookModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Cheque Book')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book ID')).toBeInTheDocument();
        expect(screen.getByText('Account Holder Name')).toBeInTheDocument();
        expect(screen.getByText('Account Number')).toBeInTheDocument();
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        expect(screen.getByText('Currency')).toBeInTheDocument();
        expect(screen.getByText('Upload Cheque Copy')).toBeInTheDocument();
    });

    it('calls handleChequeBookCreation on form submit', async () => {
        const handleChequeBookCreation = vi.fn();
        (useChequeBookCreate as any).mockReturnValue({
            handleChequeBookCreation,
            submitLoading: false,
        });

        render(
            <ChequeBookModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter cheque book ID'), {
            target: { value: '12345' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter account holder name'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter account number'), {
            target: { value: '1234567890123456' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter bank name'), {
            target: { value: 'Bank XYZ' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter cheque starting number'), {
            target: { value: '00001' },
        });
        fireEvent.mouseDown(screen.getByText('Select status'));
        const statusOption = await screen.findByText('Expired');
        fireEvent.click(statusOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleChequeBookCreation).toHaveBeenCalled());
    });

    it('calls updateCheqBookDetails when editing an existing record', async () => {
        const updateCheqBookDetails = vi.fn();
        (useUpdateChequeBook as any).mockReturnValue({
            updateCheqBookDetails,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            bookId: '12345',
            accountName: 'John Doe',
            accountNumber: '1234567890123456',
            bankName: 'Bank XYZ',
            currency: 'Dollar',
            chequeStarting: '00001',
            status: 'Active',
        };

        render(
            <ChequeBookModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter cheque book ID'), {
            target: { value: '67890' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() =>
            expect(updateCheqBookDetails).toHaveBeenCalledWith(
                expect.objectContaining({ bookId: '67890' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useChequeBookCreate as any).mockReturnValue({
            handleChequeBookCreation: vi.fn(),
            submitLoading: true,
        });

        render(
            <ChequeBookModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <ChequeBookModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

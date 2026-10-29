import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChequeLeafModal from '../../../components/Modals/ChequeLeafModal';
import useChequeLeafCreate from '../../../hooks/financialDocHooks/useCreateChequeLeafApi';
import { useUpdateChequeLeaf } from '../../../hooks/financialDocHooks/useUpdateCheckLeafApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/financialDocHooks/useCreateChequeLeafApi', () => ({
    default: vi.fn(() => ({
        handleChequeLeafCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/financialDocHooks/useUpdateCheckLeafApi', () => ({
    useUpdateChequeLeaf: vi.fn(() => ({
        updateChequeLeafDetails: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/financialDocHooks/useGetChequeBooksLIstApi', () => ({
    useGetAllChequeBookListApi: vi.fn(() => ({
        data: [],
        generateChequeBooksDropdown: vi.fn(() => []),
    })),
}));

describe('ChequeLeafModal', () => {
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
            <ChequeLeafModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Cheque')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book Number')).toBeInTheDocument();
        expect(screen.getByText('Payee Name')).toBeInTheDocument();
        expect(screen.getByText('Cheque Number')).toBeInTheDocument();
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        expect(screen.getByText('Cheque Date')).toBeInTheDocument();
        expect(screen.getByText('Due Date')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Upload Cheque Copy')).toBeInTheDocument();
    });

    it('calls handleChequeLeafCreation on form submit', async () => {
        const handleChequeLeafCreation = vi.fn();
        (useChequeLeafCreate as any).mockReturnValue({
            handleChequeLeafCreation,
            submitLoading: false,
        });

        render(
            <ChequeLeafModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter cheque book number'), {
            target: { value: '12345' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter payee name'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter cheque number'), {
            target: { value: '67890' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter bank name'), {
            target: { value: 'Bank XYZ' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
            target: { value: '1000' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), {
            target: { value: 'Jane Doe' },
        });
        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });

        // date of cheque
        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        // due date
        fireEvent.click(calendarIcon[1]);
        fireEvent.click(screen.getAllByText('Today')[1]);

        fireEvent.mouseDown(screen.getByText('Select status'));
        const statusOption = await screen.findByText('Expired');
        fireEvent.click(statusOption);

        fireEvent.mouseDown(screen.getByText('Select cheque type'));
        const typeOption = await screen.findByText('Credit', {
            selector: 'div.ant-select-item-option-content',
        });
        fireEvent.click(typeOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(handleChequeLeafCreation).toHaveBeenCalled();
        });
    });

    it('calls updateChequeLeafDetails when editing an existing record', async () => {
        const updateChequeLeafDetails = vi.fn();
        (useUpdateChequeLeaf as any).mockReturnValue({
            updateChequeLeafDetails,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            chequeBookNumber: '12345',
            payeeName: 'John Doe',
            chequeNumber: '67890',
            type: 'Debit',
            bankAccount: 'Bank XYZ',
            dateOfCheque: '2024-09-01',
            dueDate: '2024-09-10',
            amount: '1000',
            status: 'Issued',
            signedBy: 'John Doe',
        };

        render(
            <ChequeLeafModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
                setRefState={mockSetRefState}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter payee name'), {
            target: { value: 'Jane Doe' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() =>
            expect(updateChequeLeafDetails).toHaveBeenCalledWith(
                expect.objectContaining({ payeeName: 'Jane Doe' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useChequeLeafCreate as any).mockReturnValue({
            handleChequeLeafCreation: vi.fn(),
            submitLoading: true,
        });

        render(
            <ChequeLeafModal
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
            <ChequeLeafModal
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

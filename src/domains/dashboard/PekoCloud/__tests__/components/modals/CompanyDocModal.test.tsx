import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CompanyDocModal from '../../../components/Modals/CompanyDocModal';
import useCompanyDocCreate from '../../../hooks/companyDocHooks/useCreateCompanyDocApi';
import { useUpdateCompanyDoc } from '../../../hooks/companyDocHooks/useUpdateCompanyDocApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/companyDocHooks/useCreateCompanyDocApi', () => ({
    default: vi.fn(() => ({
        handleCompanyDocCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/companyDocHooks/useUpdateCompanyDocApi', () => ({
    useUpdateCompanyDoc: vi.fn(() => ({
        updateCompanyDocs: vi.fn(),
        submitLoading: false,
    })),
}));

describe('CompanyDocModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <CompanyDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Document Number')).toBeInTheDocument();
        expect(screen.getByText('Issued Date')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
        expect(screen.getByText('Upload Document Copy')).toBeInTheDocument();
    });

    it('calls handleCompanyDocCreation on form submit', async () => {
        const handleCompanyDocCreation = vi.fn();
        (useCompanyDocCreate as any).mockReturnValue({
            handleCompanyDocCreation,
            submitLoading: false,
        });

        render(
            <CompanyDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document name'), {
            target: { value: 'Document A' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter document number'), {
            target: { value: '123456' },
        });

        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });

        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(handleCompanyDocCreation).toHaveBeenCalled();
        });
    });

    it('calls updateCompanyDocs when editing an existing record', async () => {
        const updateCompanyDocs = vi.fn();
        (useUpdateCompanyDoc as any).mockReturnValue({
            updateCompanyDocs,
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
            <CompanyDocModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter document name'), {
            target: { value: 'Updated Document' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() =>
            expect(updateCompanyDocs).toHaveBeenCalledWith(
                expect.objectContaining({ documentName: 'Updated Document' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useCompanyDocCreate as any).mockReturnValue({
            handleCompanyDocCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateCompanyDoc as any).mockReturnValue({
            updateCompanyDocs: vi.fn(),
            submitLoading: true,
        });

        render(
            <CompanyDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <CompanyDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VehicleDocModal from '../../../components/Modals/VehicleDocModal';
import useVehicleDocCreate from '../../../hooks/fleetHooks/useCreateVehicleDocApi';
import { useUpdateVehicleDoc } from '../../../hooks/fleetHooks/useUpdateVehicleDocApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: () => ({
            state: { fleetId: '123' },
        }),
    };
});

vi.mock('../../../hooks/fleetHooks/useCreateVehicleDocApi', () => ({
    default: vi.fn(() => ({
        handleVehicleDocCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/fleetHooks/useUpdateVehicleDocApi', () => ({
    useUpdateVehicleDoc: vi.fn(() => ({
        updateVehicleDocs: vi.fn(),
        submitLoading: false,
    })),
}));

describe('VehicleDocModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <VehicleDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
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

    it('calls handleVehicleDocCreation on form submit when adding a new document', async () => {
        const handleVehicleDocCreation = vi.fn();
        (useVehicleDocCreate as any).mockReturnValue({
            handleVehicleDocCreation,
            submitLoading: false,
        });

        render(
            <VehicleDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
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

        // Simulate date selection
        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(handleVehicleDocCreation).toHaveBeenCalled();
        });
    });

    it('calls updateVehicleDocs when editing an existing record', async () => {
        const updateVehicleDocs = vi.fn();
        (useUpdateVehicleDoc as any).mockReturnValue({
            updateVehicleDocs,
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
            <VehicleDocModal
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
            expect(updateVehicleDocs).toHaveBeenCalledWith(
                expect.objectContaining({ documentName: 'Updated Document' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useVehicleDocCreate as any).mockReturnValue({
            handleVehicleDocCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateVehicleDoc as any).mockReturnValue({
            updateVehicleDocs: vi.fn(),
            submitLoading: true,
        });

        render(
            <VehicleDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <VehicleDocModal open handleCancel={mockHandleCancel} reloadTable={mockReloadTable} />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});

import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VehicleMaintenanceModal from '../../../components/Modals/VehicleMaintenanceModal';
import useMaintenanceCreate from '../../../hooks/fleetHooks/useCreateMaintenanceApi';
import { useUpdateMaintenanceHistory } from '../../../hooks/fleetHooks/useUpdateMaintenanceApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/fleetHooks/useCreateMaintenanceApi', () => ({
    default: vi.fn(() => ({
        handleMaintenanceHistoryCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/fleetHooks/useUpdateMaintenanceApi', () => ({
    useUpdateMaintenanceHistory: vi.fn(() => ({
        updateVehicleMaintenanceData: vi.fn(),
        submitLoading: false,
    })),
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

describe('VehicleMaintenanceModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <VehicleMaintenanceModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Maintenance Details')).toBeInTheDocument();
        expect(screen.getByText('Repair Category')).toBeInTheDocument();
        expect(screen.getByText('Service Type')).toBeInTheDocument();
        expect(screen.getByText('Assign Date')).toBeInTheDocument();
        expect(screen.getByText('Received Date')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('calls handleMaintenanceHistoryCreation on form submit when creating a new record', async () => {
        const handleMaintenanceHistoryCreation = vi.fn();
        (useMaintenanceCreate as any).mockReturnValue({
            handleMaintenanceHistoryCreation,
            submitLoading: false,
        });

        render(
            <VehicleMaintenanceModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter repair category'), {
            target: { value: 'Engine Repair' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter service type'), {
            target: { value: 'Oil Change' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
            target: { value: '300' },
        });

        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(handleMaintenanceHistoryCreation).toHaveBeenCalled();
        });
    });

    it('calls updateVehicleMaintenanceData when editing an existing record', async () => {
        const updateVehicleMaintenanceData = vi.fn();
        (useUpdateMaintenanceHistory as any).mockReturnValue({
            updateVehicleMaintenanceData,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            repairCategory: 'Engine Repair',
            serviceType: 'Oil Change',
            dateAndTime: '2024-09-01',
            dateReceived: '2024-09-05',
            amount: '300',
        };

        render(
            <VehicleMaintenanceModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter repair category'), {
            target: { value: 'Transmission Repair' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() =>
            expect(updateVehicleMaintenanceData).toHaveBeenCalledWith(
                expect.objectContaining({ repairCategory: 'Transmission Repair' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useMaintenanceCreate as any).mockReturnValue({
            handleMaintenanceHistoryCreation: vi.fn(),
            submitLoading: true,
        });

        render(
            <VehicleMaintenanceModal
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
            <VehicleMaintenanceModal
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

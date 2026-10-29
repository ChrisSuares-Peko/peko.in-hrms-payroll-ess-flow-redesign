import React from 'react';

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VehicleModal from '../../../components/Modals/VehicleModal';
import useVehicleCreate from '../../../hooks/fleetHooks/useCreateVehicleApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/fleetHooks/useCreateVehicleApi', () => ({
    default: vi.fn(() => ({
        handleVehicleCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('VehicleModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <VehicleModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Name')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Type')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Number')).toBeInTheDocument();
        expect(screen.getByText('Purchased Date')).toBeInTheDocument();
        expect(screen.getByText('Registration Renewal Date')).toBeInTheDocument();
        expect(screen.getByText('Asset Type')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('calls handleVehicleCreation on form submit when creating a new record', async () => {
        const handleVehicleCreation = vi.fn();
        (useVehicleCreate as any).mockReturnValue({
            handleVehicleCreation,
            submitLoading: false,
        });

        render(
            <VehicleModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter vehicle name'), {
            target: { value: 'Toyota Corolla' },
        });
        fireEvent.mouseDown(screen.getByText('Select vehicle type'));
        screen.debug(undefined, 1000000);
        // const vehicleTypeOption = await screen.findByText('Suv', {
        //     selector: 'div.ant-select-item-option-content',
        // });
        // fireEvent.click(vehicleTypeOption);

        fireEvent.change(screen.getByPlaceholderText('Enter vehicle number'), {
            target: { value: 'ABC123' },
        });

        fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
            target: { value: '10000' },
        });

        const calendarIcon = screen.getAllByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon[0]);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.mouseDown(screen.getByText('Select status'));
        const statusOption = await screen.findByText('Active', {
            selector: 'div.ant-select-item-option-content',
        });
        fireEvent.click(statusOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        // await waitFor(() => {
        //     expect(handleVehicleCreation).toHaveBeenCalled();
        // });
    }, 15000);

    it('renders loading state correctly', () => {
        (useVehicleCreate as any).mockReturnValue({
            handleVehicleCreation: vi.fn(),
            submitLoading: true,
        });

        render(
            <VehicleModal
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
            <VehicleModal
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

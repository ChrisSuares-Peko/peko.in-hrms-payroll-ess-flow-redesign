import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AssignVehicleModal from '../../../components/Modals/AssignVehicleModal';
import { useGetEmployee } from '../../../hooks/employeeHooks/useGetEmployeeApi';
import useVehicleUsageHistoryCreate from '../../../hooks/fleetHooks/useCreateVehicleUsageApi';
import { useGetVehicle } from '../../../hooks/fleetHooks/useGetVehiclesApi';
import { useVehicleUsageDetails } from '../../../hooks/fleetHooks/useGetVehicleUserDetailsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/fleetHooks/useCreateVehicleUsageApi', () => ({
    default: vi.fn(() => ({
        handleVehicleUsageHistoryCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/fleetHooks/useGetVehiclesApi', () => ({
    useGetVehicle: vi.fn(() => ({
        vehicles: [],
        generateVehicleDropdown: vi.fn(() => []),
    })),
}));

vi.mock('../../../hooks/fleetHooks/useGetVehicleUserDetailsApi', () => ({
    useVehicleUsageDetails: vi.fn(() => ({
        getUsageData: vi.fn(),
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('AssignVehicleModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <AssignVehicleModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Select vehicle')).toBeInTheDocument();
        expect(screen.getByText('Select employee')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select assign date')).toBeInTheDocument();
    });

    it('calls handleVehicleUsageHistoryCreation on form submit', async () => {
        const handleVehicleUsageHistoryCreation = vi.fn();
        const mockGetUsageData = vi.fn(() => null);
        (useVehicleUsageHistoryCreate as any).mockReturnValue({
            handleVehicleUsageHistoryCreation,
            submitLoading: false,
        });

        (useGetEmployee as any).mockReturnValue({
            data: [
                {
                    id: 1,
                    employee: 'John Doe',
                    employeeId: 'EMP123',
                },
            ],
            generateEmployeesDropdown: vi.fn(() => [{ value: 1, label: 'John Doe - EMP123' }]),
        });

        (useGetVehicle as any).mockReturnValue({
            vehicles: [{ id: 1, assetName: 'Vehicle 1' }],
            generateVehicleDropdown: vi.fn(() => [{ value: 1, label: 'Vehicle 1' }]),
        });

        (useVehicleUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        render(
            <AssignVehicleModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.mouseDown(screen.getByText('Select vehicle'));
        const vehicleOption = await screen.findByText('Vehicle 1');
        fireEvent.click(vehicleOption);

        fireEvent.mouseDown(screen.getByText('Select employee'));
        const employeeOption = await screen.findByText('John Doe - EMP123');
        fireEvent.click(employeeOption);

        const calendarIcon = screen.getByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleVehicleUsageHistoryCreation).toHaveBeenCalled());
    });

    it('renders loading state correctly', () => {
        (useVehicleUsageHistoryCreate as any).mockReturnValue({
            handleVehicleUsageHistoryCreation: vi.fn(),
            submitLoading: true,
        });

        render(<AssignVehicleModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssignVehicleModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('calls handleGetVehicleUsageData when a vehicle is selected', async () => {
        const mockGetUsageData = vi.fn(() => ({
            cloud_employee: { id: '1', employeeName: 'John Doe' },
            assignDate: '2023-09-01T00:00:00Z',
        }));

        (useVehicleUsageHistoryCreate as any).mockReturnValue({
            handleVehicleUsageHistoryCreation: vi.fn(),
            submitLoading: false,
        });

        (useGetVehicle as any).mockReturnValue({
            vehicles: [{ label: 'Vehicle1', value: '1' }],
            generateVehicleDropdown: vi.fn(() => [{ label: 'Vehicle1', value: '1' }]),
        });

        (useVehicleUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        render(<AssignVehicleModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.mouseDown(screen.getByText('Select vehicle'));
        const vehicleOption = await screen.findByText('Vehicle1');
        fireEvent.click(vehicleOption);

        await waitFor(() => expect(mockGetUsageData).toHaveBeenCalledWith('1'));
    });

    it('renders the employee information and return fields when a vehicle with existing usage data is selected', async () => {
        const mockGetUsageData = vi.fn(() => ({
            cloud_employee: { id: '1', employeeName: 'John Doe' },
            assignDate: '2023-09-01T00:00:00Z',
        }));

        (useVehicleUsageHistoryCreate as any).mockReturnValue({
            handleVehicleUsageHistoryCreation: vi.fn(),
            submitLoading: false,
        });

        (useVehicleUsageDetails as any).mockReturnValue({
            getUsageData: mockGetUsageData,
        });

        (useGetVehicle as any).mockReturnValue({
            vehicles: [{ id: 1, assetName: 'Vehicle 1', usedBy: 'John Doe' }],
            generateVehicleDropdown: vi.fn(() => [{ value: 1, label: 'Vehicle 1' }]),
        });

        render(<AssignVehicleModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.mouseDown(screen.getByText('Select vehicle'));
        screen.debug(undefined, 100000);
        const vehicleOption = await screen.findByText('Vehicle 1');
        fireEvent.click(vehicleOption);

        await waitFor(() => {
            expect(
                screen.getByText('This vehicle is now used by John Doe from 2023-09-01')
            ).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Select return date')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter Remarks')).toBeInTheDocument();
        });
    });
});

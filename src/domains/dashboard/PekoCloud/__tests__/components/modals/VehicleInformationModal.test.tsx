import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VehicleInformationModal from '../../../components/Modals/VehicleInformationModal';
import { useUpdateVehicle } from '../../../hooks/fleetHooks/useUpdateVehicleApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('../../../hooks/fleetHooks/useUpdateVehicleApi', () => ({
    useUpdateVehicle: vi.fn(() => ({
        updateVehicleData: vi.fn(),
        submitLoading: false,
    })),
}));

describe('VehicleInformationModal', () => {
    const mockHandleCancel = vi.fn();
    const mockSetRefState = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly with initial values', () => {
        render(
            <VehicleInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                vehicleData={{
                    data: {
                        id: '1',
                        vehicleName: 'Test Vehicle',
                        vehicleType: 'Type A',
                        purchasedDate: '2024-01-01',
                        vehicleNumber: 'VN123',
                        amount: '1000',
                        amountRecurring: 'Monthly',
                        vendor: 'Vendor A',
                        modelYear: '2024',
                        chassisNumber: 'CH123',
                        engineTransmission: 'Automatic',
                        odoMeter: '10000',
                        dateOfRenewal: '2025-01-01',
                        status: 'Active',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Vehicle Information')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Type')).toBeInTheDocument();
        expect(screen.getByText('Purchased Date')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Number')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Amount Recurring')).toBeInTheDocument();
        expect(screen.getByText('Vendor Name')).toBeInTheDocument();
        expect(screen.getByText('Model Year')).toBeInTheDocument();
        expect(screen.getByText('Chassis Number')).toBeInTheDocument();
        expect(screen.getByText('Engine Transmission')).toBeInTheDocument();
        expect(screen.getByText('ODO Meter')).toBeInTheDocument();
        expect(screen.getByText('Registration Renewal Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders correctly with pre-filled values in edit mode', () => {
        render(
            <VehicleInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                vehicleData={{
                    data: {
                        id: '1',
                        vehicleName: 'Existing Vehicle',
                        vehicleType: 'Type B',
                        purchasedDate: '2024-02-01',
                        vehicleNumber: 'VN456',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        vendor: 'Vendor B',
                        modelYear: '2023',
                        chassisNumber: 'CH456',
                        engineTransmission: 'Manual',
                        odoMeter: '20000',
                        dateOfRenewal: '2025-02-01',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByDisplayValue('VN456')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Vendor B')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CH456')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Manual')).toBeInTheDocument();
        expect(screen.getByDisplayValue('20000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2025-02-01')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('calls updateVehicleData on form submit', async () => {
        const updateVehicleData = vi.fn();
        (useUpdateVehicle as any).mockReturnValue({
            updateVehicleData,
            submitLoading: false,
        });

        render(
            <VehicleInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                vehicleData={{
                    data: {
                        id: '1',
                        vehicleName: 'Existing Vehicle',
                        vehicleType: 'Type B',
                        purchasedDate: '2024-02-01',
                        vehicleNumber: 'VN456',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        vendor: 'Vendor B',
                        modelYear: '2023',
                        chassisNumber: 'CH456',
                        engineTransmission: 'Manual',
                        odoMeter: '20000',
                        dateOfRenewal: '2025-02-01',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter vehicle number'), {
            target: { value: 'Updated Vehicle' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
            target: { value: '3000' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(updateVehicleData).toHaveBeenCalled());
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <VehicleInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                vehicleData={{
                    data: {
                        id: '1',
                        vehicleName: 'Existing Vehicle',
                        vehicleType: 'Type B',
                        purchasedDate: '2024-02-01',
                        vehicleNumber: 'VN456',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        vendor: 'Vendor B',
                        modelYear: '2023',
                        chassisNumber: 'CH456',
                        engineTransmission: 'Manual',
                        odoMeter: '20000',
                        dateOfRenewal: '2025-02-01',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('renders loading state correctly', () => {
        (useUpdateVehicle as any).mockReturnValue({
            updateVehicleData: vi.fn(),
            submitLoading: true,
        });

        render(
            <VehicleInformationModal
                open
                handleCancel={mockHandleCancel}
                setRefState={mockSetRefState}
                vehicleData={{
                    data: {
                        id: '1',
                        vehicleName: 'Existing Vehicle',
                        vehicleType: 'Type B',
                        purchasedDate: '2024-02-01',
                        vehicleNumber: 'VN456',
                        amount: '2000',
                        amountRecurring: 'Yearly',
                        vendor: 'Vendor B',
                        modelYear: '2023',
                        chassisNumber: 'CH456',
                        engineTransmission: 'Manual',
                        odoMeter: '20000',
                        dateOfRenewal: '2025-02-01',
                        status: 'Inactive',
                    },
                }}
                initialValues={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });
});

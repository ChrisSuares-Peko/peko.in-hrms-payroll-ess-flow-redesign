import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import VehicleUsageHistoryModal from '../../../components/Modals/VehicleUsageHistoryModal';
import useVehicleUsageHistoryCreate from '../../../hooks/fleetHooks/useCreateVehicleUsageApi';
import { useUpdateVehicleUsageHistory } from '../../../hooks/fleetHooks/useUpdateVehicleUsageApi';

// Mock the dependencies
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

vi.mock('../../../hooks/fleetHooks/useUpdateVehicleUsageApi', () => ({
    useUpdateVehicleUsageHistory: vi.fn(() => ({
        updateVehicleUsageData: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

describe('VehicleUsageHistoryModal', () => {
    const mockHandleCancel = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly in add mode', () => {
        render(
            <VehicleUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                cloudFleetId={1}
                selectedRecordData={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Employee name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select assign date')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select return date')).toBeInTheDocument();
        expect(screen.getByText('Return Status')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Remarks')).toBeInTheDocument();
    });

    it('renders correctly in edit mode with selectedRecordData', () => {
        render(
            <VehicleUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                cloudFleetId={1}
                selectedRecordData={{
                    employee: 'Employee 1',
                    assignDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    returnDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                }}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Good condition')).toBeInTheDocument();
    });

    it('calls updateVehicleUsageData on form submit in edit mode', async () => {
        const updateVehicleUsageData = vi.fn();
        (useUpdateVehicleUsageHistory as any).mockReturnValue({
            updateVehicleUsageData,
            submitLoading: false,
        });

        render(
            <VehicleUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                cloudFleetId={1}
                selectedRecordData={{
                    id: '1',
                    empId: '1',
                    employee: 'Employee 1',
                    assignDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                    returnDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
                    returnStatus: 'Returned',
                    remarks: 'Good condition',
                }}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Remarks'), {
            target: { value: 'Updated condition' },
        });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(updateVehicleUsageData).toHaveBeenCalled();
        });
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <VehicleUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                cloudFleetId={1}
                selectedRecordData={null}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('renders loading state correctly', () => {
        (useVehicleUsageHistoryCreate as any).mockReturnValue({
            handleVehicleUsageHistoryCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateVehicleUsageHistory as any).mockReturnValue({
            updateVehicleUsageData: vi.fn(),
            submitLoading: true,
        });

        render(
            <VehicleUsageHistoryModal
                open
                handleCancel={mockHandleCancel}
                cloudFleetId={1}
                selectedRecordData={null}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });
});

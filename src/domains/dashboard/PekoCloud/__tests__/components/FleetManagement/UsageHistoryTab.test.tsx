import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import UsageHistoryTab from '../../../components/FleetManagement/UsageHistoryTab';
import { useDeleteVehicleUsageApi } from '../../../hooks/fleetHooks/useDeleteVehicleUsageApi';
import { useGetAllVehicleUsageApi } from '../../../hooks/fleetHooks/useListVehicleUsageApi';

// Mock dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn().mockReturnValue({
        role: 'admin',
        id: 123,
    }),
    useAppDispatch: vi.fn(),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: false })), // Adjust based on test needs
}));
vi.mock('../../../hooks/fleetHooks/useDeleteVehicleUsageApi', () => ({
    useDeleteVehicleUsageApi: vi.fn(() => ({
        deleteVehicleUsageData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/fleetHooks/useListVehicleUsageApi.ts', () => ({
    useGetAllVehicleUsageApi: vi.fn(() => ({
        tableDatas: [],
        orderCount: 0,
        tableLoading: false,
    })),
}));
vi.mock('../../../components/FleetManagement/UsageHistoryMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>UsageHistoryMobileView</div>),
}));
vi.mock('../../../components/Modals/VehicleUsageHistoryModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleUsageHistoryModal</div>),
}));
vi.mock('../../../components/Modals/AssignVehicleModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignVehicleModal</div>),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
        </div>
    )),
}));

describe('UsageHistoryTab', () => {
    const mockHandleDeleteVehicleUsage = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { fleetId: 1 } });
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetAllVehicleUsageApi as any).mockReturnValue({
            tableDatas: [
                {
                    employee: 'John Doe',
                    employeeEmail: 'john.doe@example.com',
                    assignDate: '2024-04-12',
                    returnDate: '',
                    returnStatus: 'Assigned',
                    remarks: '',
                    status: '',
                    actions: '',
                    id: '1',
                    empId: '123',
                },
            ],
            orderCount: 1,
            tableLoading: false,
        });
        (useDeleteVehicleUsageApi as any).mockReturnValue({
            deleteVehicleUsageData: mockHandleDeleteVehicleUsage,
            isLoading: false,
        });
    });

    it('renders the component correctly in desktop view', () => {
        render(<UsageHistoryTab />);
        expect(screen.getByPlaceholderText('Search for usage history')).toBeInTheDocument();
        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders the component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<UsageHistoryTab />);
        expect(screen.getByText('UsageHistoryMobileView')).toBeInTheDocument();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllVehicleUsageApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });
        const { container } = render(<UsageHistoryTab />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<UsageHistoryTab />);

        const search = screen.getByPlaceholderText(/Search for usage history/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
    });

    it('opens AssignVehicleModal when "Assign Vehicle" button is clicked', () => {
        render(<UsageHistoryTab />);
        fireEvent.click(screen.getByText('Assign Vehicle'));
        expect(screen.getByText('AssignVehicleModal')).toBeInTheDocument();
    });

    it('opens VehicleUsageHistoryModal when editing usage history', () => {
        render(<UsageHistoryTab />);
        fireEvent.click(screen.getByRole('img', { name: /Edit/i }));
        expect(screen.getByText('VehicleUsageHistoryModal')).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<UsageHistoryTab />);

        fireEvent.click(screen.getByRole('img', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteVehicleUsage).toHaveBeenCalled();
        });
    });
});

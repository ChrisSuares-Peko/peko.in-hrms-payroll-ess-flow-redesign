import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import MaintenanceTab from '../../../components/FleetManagement/MaintenanceTab';
import { useDeleteMaintenanceHistoryApi } from '../../../hooks/fleetHooks/useDeleteMaintenanceApi';
import { useGetAllVehicleMaintenanceDataApi } from '../../../hooks/fleetHooks/useListMaintenanceApi';

// Mock dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: false })),
}));
vi.mock('../../../hooks/fleetHooks/useDeleteMaintenanceApi', () => ({
    useDeleteMaintenanceHistoryApi: vi.fn(() => ({
        deleteVehicleMaintanceData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/fleetHooks/useListMaintenanceApi', () => ({
    useGetAllVehicleMaintenanceDataApi: vi.fn(() => ({
        tableDatas: [],
        orderCount: 0,
        tableLoading: false,
    })),
}));
vi.mock('../../../components/Modals/VehicleMaintenanceModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleMaintenanceModal</div>),
}));
vi.mock('../../../components/FleetManagement/MaintenanceMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>MaintenaceMobileView</div>),
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
vi.mock('../../../utils/useFilter.ts', () => ({
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
    })),
}));

describe('MaintenanceTab', () => {
    const mockHandleDeleteMaintenanceData = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { fleetId: 1 } });
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetAllVehicleMaintenanceDataApi as any).mockReturnValue({
            tableDatas: [
                {
                    id: '1',
                    document: 'docKey',
                    documentName: 'docName',
                    issueDate: '12-04-2024',
                    documentNumber: '23412424',
                },
            ],
            orderCount: 1,
            tableLoading: false,
        });
        (useDeleteMaintenanceHistoryApi as any).mockReturnValue({
            deleteVehicleMaintanceData: mockHandleDeleteMaintenanceData,
            isLoading: false,
        });
    });

    it('renders component correctly in desktop view', () => {
        render(<MaintenanceTab />);
        expect(screen.getByPlaceholderText('Search for maintenace history')).toBeInTheDocument();
        expect(screen.getByText('Record Maintenance')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<MaintenanceTab />);
        expect(screen.getByText('MaintenaceMobileView')).toBeInTheDocument();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllVehicleMaintenanceDataApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });
        const { container } = render(<MaintenanceTab />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<MaintenanceTab />);
        const search = screen.getByPlaceholderText(/Search for maintenace history/i);
        fireEvent.change(search, { target: { value: 'test' } });
        expect(search).toHaveValue('test');
    });

    it('opens VehicleMaintenanceModal when "Record Maintenance" is clicked', () => {
        render(<MaintenanceTab />);
        fireEvent.click(screen.getByText('Record Maintenance'));
        expect(screen.getByText('VehicleMaintenanceModal')).toBeInTheDocument();
    });

    it('handles delete and opens ConfirmationModal', async () => {
        render(<MaintenanceTab />);
        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        screen.debug(undefined, 10000);

        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteMaintenanceData).toHaveBeenCalled();
        });
    });

    it('handles edit action', async () => {
        render(<MaintenanceTab />);
        fireEvent.click(screen.getByRole('img', { name: /Edit/i }));
        expect(screen.getByText('VehicleMaintenanceModal')).toBeInTheDocument();
    });
});

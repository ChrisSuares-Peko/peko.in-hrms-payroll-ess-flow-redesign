import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MaintenaceMobileView from '../../../components/FleetManagement/MaintenanceMobileView';
import { useDeleteMaintenanceHistoryApi } from '../../../hooks/fleetHooks/useDeleteMaintenanceApi';

vi.mock('../../../hooks/fleetHooks/useDeleteMaintenanceApi', () => ({
    useDeleteMaintenanceHistoryApi: vi.fn(),
}));
vi.mock('../../../components/Modals/VehicleMaintenanceModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleMaintenanceModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));
vi.mock('../../../components/FleetManagement/MaintenaceMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>MaintenanceMobileCard</div>),
}));

describe('MaintenaceMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteMaintenanceData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, dateAndTime: '2024-08-30T12:00:00Z', repairCategory: 'Engine' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteMaintenanceHistoryApi as any).mockReturnValue({
            deleteVehicleMaintanceData: mockDeleteMaintenanceData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<MaintenaceMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for maintenance history')).toBeInTheDocument();
        expect(screen.getByText('Record Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Repair Category')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<MaintenaceMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for maintenance history'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<MaintenaceMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens VehicleMaintenanceModal when "Record Maintenance" is clicked', () => {
        render(<MaintenaceMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Record Maintenance'));
        expect(screen.getByText('VehicleMaintenanceModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<MaintenaceMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<MaintenaceMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

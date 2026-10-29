import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FleetMobileView from '../../../components/fleet/FleetMobileView';
import { useDeleteVehicleApi } from '../../../hooks/fleetHooks/useDeleteVehicleApi';

vi.mock('../../../hooks/fleetHooks/useDeleteVehicleApi', () => ({
    useDeleteVehicleApi: vi.fn(),
}));
vi.mock('../../../components/fleet/FleetMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FleetMobileCard</div>),
}));
vi.mock('../../../components/Modals/VehicleModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleModal</div>),
}));
vi.mock('../../../components/Modals/AssignVehicleModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignVehicleModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
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

describe('FleetMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteVehicleData = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, vehicleName: 'Test Vehicle', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        reloadInfo: mockReloadInfo,
        vehicleList: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteVehicleApi as any).mockReturnValue({
            deleteVehicleData: mockDeleteVehicleData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<FleetMobileView {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for fleet')).toBeInTheDocument();
        expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<FleetMobileView {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.change(screen.getByPlaceholderText('Search for fleet'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalledWith(expect.any(Object));
    });

    it('calls handlePageChange on page change', () => {
        render(<FleetMobileView {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens VehicleModal when "Add Vehicle" is clicked', () => {
        render(<FleetMobileView {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Add Vehicle'));
        expect(screen.getByText('VehicleModal')).toBeInTheDocument();
    });

    it('opens AssignVehicleModal when "Assign Vehicle" is clicked', () => {
        render(<FleetMobileView {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Assign Vehicle'));
        expect(screen.getByText('AssignVehicleModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<FleetMobileView {...defaultProps} tableLoading />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<FleetMobileView {...defaultProps} tableDatas={[]} />, { wrapper: MemoryRouter });
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

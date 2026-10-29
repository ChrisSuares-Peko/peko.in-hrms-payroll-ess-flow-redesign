import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsageHistoryMobileView from '../../../components/FleetManagement/UsageHistoryMobileView';
import { useDeleteVehicleUsageApi } from '../../../hooks/fleetHooks/useDeleteVehicleUsageApi';

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('../../../hooks/fleetHooks/useDeleteVehicleUsageApi', () => ({
    useDeleteVehicleUsageApi: vi.fn(),
}));
vi.mock('../../../components/FleetManagement/UsageHistoryMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>UsageHistoryMobileCard</div>),
}));
vi.mock('../../../components/Modals/AssignVehicleModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignVehicleModal</div>),
}));
vi.mock('../../../components/Modals/VehicleUsageHistoryModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleUsageHistoryModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('UsageHistoryMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteVehicleUsageData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, employee: 'John Doe', status: 'Completed' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteVehicleUsageApi as any).mockReturnValue({
            deleteVehicleUsageData: mockDeleteVehicleUsageData,
            isLoading: false,
        });
        (useLocation as any).mockReturnValue({ state: { fleetId: 1 } });
    });

    it('renders the component correctly', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for usage history')).toBeInTheDocument();
        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Employee Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for usage history'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens AssignVehicleModal when "Assign Vehicle" button is clicked', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Vehicle'));
        expect(screen.getByText('AssignVehicleModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<UsageHistoryMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<UsageHistoryMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

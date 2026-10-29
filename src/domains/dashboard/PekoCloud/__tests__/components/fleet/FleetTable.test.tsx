import { DeleteOutlined } from '@ant-design/icons';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Button, Space } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import FleetTable from '../../../components/fleet/FleetTable';
import { useDeleteVehicleApi } from '../../../hooks/fleetHooks/useDeleteVehicleApi';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    __esModule: true,
    default: vi.fn(() => ({ xs: false })), // Mock screen size as not xs for default view
}));
vi.mock('../../../hooks/fleetHooks/useDeleteVehicleApi', () => ({
    useDeleteVehicleApi: vi.fn(() => ({
        deleteVehicleData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../components/Modals/VehicleModal', () => ({
    __esModule: true,
    default: vi.fn(
        ({ open, handleCancel }) =>
            open && (
                <div>
                    VehicleModal
                    <button type="button" onClick={handleCancel}>
                        Close
                    </button>
                </div>
            )
    ),
}));
vi.mock('../../../components/Modals/AssignVehicleModal', () => ({
    __esModule: true,
    default: vi.fn(
        ({ open, handleCancel }) =>
            open && (
                <div>
                    AssignVehicleModal
                    <button type="button" onClick={handleCancel}>
                        Close
                    </button>
                </div>
            )
    ),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit, handleCancel }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
            <button type="button" onClick={handleCancel}>
                No
            </button>
        </div>
    )),
}));
vi.mock('../../../components/fleet/FleetMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FleetMobileView</div>),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({
        xs: false,
    })),
}));
vi.mock('../../../utils/fleet/fleetManagementData.tsx', () => ({
    fleetManagementColumn: vi.fn((handleDelete, handleEdit) => [
        {
            title: 'Vehicle Name',
            dataIndex: 'vehicleName',
            key: 'vehicleName',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <Space size="middle">
                    <Button className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            onClick={() => handleDelete(record)}
                        />
                    </Button>
                </Space>
            ),
        },
    ]),
}));

describe('FleetTable', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDeleteVehicle = vi.fn();

    const defaultProps = {
        reloadInfo: vi.fn(),
        setReloadTable: mockSetReloadTable,
        orderCount: 20,
        tableLoading: false,
        tableDatas: [
            {
                id: 1,
                vehicleName: 'Truck A',
                vehicleNumber: 'T123',
                vehicleType: 'SUV',
                purchaseDate: '2023-05-15T00:00:00.000Z',
            },
        ],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        vehicleList: [],
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteVehicleApi as any).mockReturnValue({
            deleteVehicleData: mockHandleDeleteVehicle,
            isLoading: false,
        });
    });

    it('renders component correctly', () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for vehicles')).toBeInTheDocument();
        expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
        expect(screen.getByText('Assign Vehicle')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        const search = screen.getByPlaceholderText(/Search for vehicles/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens VehicleModal when "Add Vehicle" is clicked', () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Add Vehicle'));
        expect(screen.getByText('VehicleModal')).toBeInTheDocument();
    });

    it('opens AssignVehicleModal when "Assign Vehicle" is clicked', () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Assign Vehicle'));
        expect(screen.getByText('AssignVehicleModal')).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Yes'));
        await waitFor(() => {
            expect(mockHandleDeleteVehicle).toHaveBeenCalled();
        });
    });

    it('handles page change', () => {
        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        const { container } = render(<FleetTable {...defaultProps} tableLoading />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        render(<FleetTable {...defaultProps} tableDatas={[]} />, { wrapper: MemoryRouter });
        const allNoDataTexts = screen.getAllByText('No data');

        const filtered = allNoDataTexts.filter(element => !element.closest('svg'));

        expect(filtered.length).toBeGreaterThan(0);
    });

    it('renders mobile view when screen size is small', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        render(<FleetTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByText('FleetMobileView')).toBeInTheDocument();
    });
});

import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FleetDocMobileView from '../../../components/FleetManagement/FleetDocMobileView';
import { useDeleteVehicleDocApi } from '../../../hooks/fleetHooks/useDeleteVehicleDocApi';

vi.mock('../../../hooks/fleetHooks/useDeleteVehicleDocApi', () => ({
    useDeleteVehicleDocApi: vi.fn(),
}));
vi.mock('../../../components/FleetManagement/FleetDocMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FleetDocMobileCard</div>),
}));
vi.mock('../../../components/Modals/VehicleDocModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleDocModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('FleetDocMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockDeleteVehicleDocData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, documentName: 'Test Doc', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        handleDocDownload: mockHandleDocDownload,
        loadingRows: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteVehicleDocApi as any).mockReturnValue({
            deleteVehicleDocData: mockDeleteVehicleDocData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<FleetDocMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<FleetDocMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for documents'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<FleetDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens VehicleDocModal when "Add New Document" is clicked', () => {
        render(<FleetDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('VehicleDocModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<FleetDocMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('ul.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<FleetDocMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

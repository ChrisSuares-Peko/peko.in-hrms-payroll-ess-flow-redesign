import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmployeeDetailsMobileView from '../../../components/EmployeeDetails/EmployeeDetailsMobileView';
import { useDeleteEmployeeApi } from '../../../hooks/employeeHooks/useDeleteEmployeeApi';

vi.mock('../../../hooks/employeeHooks/useDeleteEmployeeApi', () => ({
    useDeleteEmployeeApi: vi.fn(),
}));
vi.mock('../../../components/EmployeeDetails/EmployeeDetailsCardMobile', () => ({
    __esModule: true,
    default: vi.fn(() => <div>EmployeeDetailsCardMobile</div>),
}));
vi.mock('../../../components/Modals/AssignAssetModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignAssetModal</div>),
}));
vi.mock('../../../components/Modals/EmployeeModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>EmployeeModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('EmployeeDetailsMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteEmployeeData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, employeeName: 'John Doe', joiningDate: '2023-05-15T00:00:00.000Z' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteEmployeeApi as any).mockReturnValue({
            deleteEmployeeData: mockDeleteEmployeeData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for employees')).toBeInTheDocument();
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByText('Employee Name')).toBeInTheDocument();
        expect(screen.getByText('Joining Date')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for employees'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens EmployeeModal when "Add Employee" is clicked', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Employee'));
        expect(screen.getByText('EmployeeModal')).toBeInTheDocument();
    });

    it('opens AssignAssetModal when "Assign Asset" is clicked', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<EmployeeDetailsMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<EmployeeDetailsMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmployeeDetailsTable from '../../../components/EmployeeDetails/employeeDetailsTable';
import { useDeleteEmployeeApi } from '../../../hooks/employeeHooks/useDeleteEmployeeApi';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    __esModule: true,
    default: vi.fn(() => ({ xs: false })), // Mock screen size as not xs for default view
}));
vi.mock('../../../hooks/employeeHooks/useDeleteEmployeeApi', () => ({
    useDeleteEmployeeApi: vi.fn(() => ({
        deleteEmployeeData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../components/Modals/EmployeeModal', () => ({
    __esModule: true,
    default: vi.fn(
        ({ open, handleCancel }) =>
            open && (
                <div>
                    EmployeeModal
                    <button type="button" onClick={handleCancel}>
                        Close
                    </button>
                </div>
            )
    ),
}));
vi.mock('../../../components/Modals/AssignAssetModal', () => ({
    __esModule: true,
    default: vi.fn(
        ({ open, handleCancel }) =>
            open && (
                <div>
                    AssignAssetModal
                    <button type="button" onClick={handleCancel}>
                        Close
                    </button>
                </div>
            )
    ),
}));
vi.mock('../../../components/EmployeeDetails/ConfirmationModal.tsx', () => ({
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

describe('EmployeeDetailsTable', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDeleteEmployee = vi.fn();

    const defaultProps = {
        reloadInfo: vi.fn(),
        setReloadTable: mockSetReloadTable,
        orderCount: 20,
        tableLoading: false,
        tableDatas: [
            {
                id: 1,
                employee: 'John Doe',
                employeeID: '123',
                joiningDate: '2023-05-15T00:00:00.000Z',
                noOfSubscriptions: [],
                noOfDevices: [],
            },
        ],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteEmployeeApi as any).mockReturnValue({
            deleteEmployeeData: mockHandleDeleteEmployee,
            isLoading: false,
        });
    });

    it('renders component correctly', () => {
        render(<EmployeeDetailsTable {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for employees')).toBeInTheDocument();
        expect(screen.getByText('Add Employee')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<EmployeeDetailsTable {...defaultProps} />);
        const search = screen.getByPlaceholderText(/Search for employees/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens EmployeeModal when "Add Employee" is clicked', () => {
        render(<EmployeeDetailsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Employee'));
        expect(screen.getByText('EmployeeModal')).toBeInTheDocument();
    });

    it('opens AssignAssetModal when "Assign Asset" is clicked', () => {
        render(<EmployeeDetailsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<EmployeeDetailsTable {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        screen.debug(undefined, 10000);
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Yes'));
        await waitFor(() => {
            expect(mockHandleDeleteEmployee).toHaveBeenCalled();
        });
    });

    it('handles page change', () => {
        render(<EmployeeDetailsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        const { container } = render(<EmployeeDetailsTable {...defaultProps} tableLoading />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        render(<EmployeeDetailsTable {...defaultProps} tableDatas={[]} />);

        const allNoDataTexts = screen.getAllByText('No data');

        const filtered = allNoDataTexts.filter(element => !element.closest('svg'));

        expect(filtered.length).toBeGreaterThan(0);
    });
});

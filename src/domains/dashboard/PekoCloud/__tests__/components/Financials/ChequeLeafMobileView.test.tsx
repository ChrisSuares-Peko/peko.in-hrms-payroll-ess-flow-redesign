import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChequeLeafMobileView from '../../../components/Financials/AdaptiveView/ChequeLeafMobileView';
import { useDeleteChequeLeafApi } from '../../../hooks/financialDocHooks/useDeleteChequeLeafApi';

// Mock hooks and components
vi.mock('../../../hooks/financialDocHooks/useDeleteChequeLeafApi', () => ({
    useDeleteChequeLeafApi: vi.fn(),
}));
vi.mock('../../Modals/ChequeLeafModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeLeafModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));
vi.mock('./ChequeLeafMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeLeafMobileCard</div>),
}));

describe('ChequeLeafMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteChequeLeafData = vi.fn();

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
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteChequeLeafApi as any).mockReturnValue({
            deleteChequeLeafData: mockDeleteChequeLeafData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<ChequeLeafMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for cheque leaves')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book NO')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<ChequeLeafMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for cheque leaves'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<ChequeLeafMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<ChequeLeafMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<ChequeLeafMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not display empty state when there is data', () => {
        render(<ChequeLeafMobileView {...defaultProps} />);
        expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
});

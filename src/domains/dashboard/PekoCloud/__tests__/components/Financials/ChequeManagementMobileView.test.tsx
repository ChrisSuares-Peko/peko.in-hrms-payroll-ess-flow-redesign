import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChequeManagementMobileView from '../../../components/Financials/AdaptiveView/ChequeManagementMobileView';
import { useDeleteChequeLeafApi } from '../../../hooks/financialDocHooks/useDeleteChequeLeafApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('../../../hooks/financialDocHooks/useDeleteChequeLeafApi', () => ({
    useDeleteChequeLeafApi: vi.fn(),
}));
vi.mock('../../../components/Modals/ChequeLeafModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeLeafModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));
vi.mock('../../../components/Financials/AdaptiveView/ChequeManagementMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeManagementMobileCard</div>),
}));

describe('ChequeManagementMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockReloadInfo = vi.fn();
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
        reloadInfo: mockReloadInfo,
        handleDocDownload: mockHandleDocDownload,
        loadingRows: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteChequeLeafApi as any).mockReturnValue({
            deleteChequeLeafData: mockDeleteChequeLeafData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<ChequeManagementMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for cheque leaves')).toBeInTheDocument();
        expect(screen.getByText('Add Cheque')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book No')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<ChequeManagementMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for cheque leaves'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<ChequeManagementMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens ChequeLeafModal when "Add Cheque" is clicked', () => {
        render(<ChequeManagementMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Cheque'));
        expect(screen.getByText('ChequeLeafModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<ChequeManagementMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<ChequeManagementMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not display empty state when there is data', () => {
        render(<ChequeManagementMobileView {...defaultProps} />);
        expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
});

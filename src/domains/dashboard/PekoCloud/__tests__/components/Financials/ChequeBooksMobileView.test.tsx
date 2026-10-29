import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChequeBooksMobileView from '../../../components/Financials/AdaptiveView/ChequeBooksMobileView';
import { useDeleteChequeBookApi } from '../../../hooks/financialDocHooks/useDeleteChequeBookApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('../../../hooks/financialDocHooks/useDeleteChequeBookApi', () => ({
    useDeleteChequeBookApi: vi.fn(),
}));
vi.mock('../../../hooks/financialDocHooks/useCreateChequeBookApi', () => ({
    default: vi.fn(() => ({
        handleChequeBookCreation: vi.fn(),
    })),
}));
vi.mock('../../../hooks/financialDocHooks/useUpdateChequeBookApi', () => ({
    useUpdateChequeBook: vi.fn(() => ({
        handleChequeBookUpdation: vi.fn(),
    })),
}));
vi.mock('../../../components/Modals/ChequeBookModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeBookModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));
vi.mock('../../../components/Financials/AdaptiveView/ChequeBooksMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeBooksMobileCard</div>),
}));

describe('ChequeBooksMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockReloadInfo = vi.fn();
    const mockDeleteChequeBookData = vi.fn();

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
        (useDeleteChequeBookApi as any).mockReturnValue({
            deleteChequeBookData: mockDeleteChequeBookData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<ChequeBooksMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for cheque books')).toBeInTheDocument();
        expect(screen.getByText('Add Cheque Book')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book ID')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<ChequeBooksMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for cheque books'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<ChequeBooksMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens ChequeBookModal when "Add Cheque Book" is clicked', () => {
        render(<ChequeBooksMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Cheque Book'));
        expect(screen.getByText('ChequeBookModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<ChequeBooksMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<ChequeBooksMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not display empty state when there is data', () => {
        render(<ChequeBooksMobileView {...defaultProps} />);
        expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
});

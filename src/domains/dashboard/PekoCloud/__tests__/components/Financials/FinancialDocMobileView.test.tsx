import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FinancialDocMobileView from '../../../components/Financials/AdaptiveView/FinancialDocMobileView';
import { useDeleteFinancialDocApi } from '../../../hooks/financialDocHooks/useDeleteFinancialDocApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';

vi.mock('../../../hooks/financialDocHooks/useDeleteFinancialDocApi', () => ({
    useDeleteFinancialDocApi: vi.fn(),
}));

vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
    })),
}));

vi.mock('../../../components/Financials/AdaptiveView/FinancialDocMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FinancialDocMobileCard</div>),
}));

vi.mock('../../../components/Modals/FinancialModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FinancialModal</div>),
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('FinancialDocMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockDeleteFinancialDocData = vi.fn();

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
        reloadInfo: vi.fn(),
        handleDocDownload: mockHandleDocDownload,
        loadingRows: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteFinancialDocApi as any).mockReturnValue({
            deleteFinacialDocData: mockDeleteFinancialDocData,
            isLoading: false,
        });
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocDownload,
        });
    });

    it('renders the component correctly', () => {
        render(<FinancialDocMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<FinancialDocMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for documents'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<FinancialDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens FinancialModal when "Add Document" is clicked', () => {
        render(<FinancialDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Document'));
        expect(screen.getByText('FinancialModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<FinancialDocMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('ul.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<FinancialDocMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CompanyDocMobileView from '../../../components/CompanyDoc/CompanyDocMobileView';
import { useDeleteCompanyDocApi } from '../../../hooks/companyDocHooks/useDeleteCompanyDocApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';

vi.mock('../../../hooks/companyDocHooks/useDeleteCompanyDocApi', () => ({
    useDeleteCompanyDocApi: vi.fn(),
}));

vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
    })),
}));

vi.mock('../../../components/CompanyDoc/CompanyDocMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>CompanyDocMobileCard</div>),
}));

vi.mock('../../../components/Modals/CompanyDocModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>CompanyDocModal</div>),
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('CompanyDocMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockDeleteCompanyDocData = vi.fn();

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
        (useDeleteCompanyDocApi as any).mockReturnValue({
            deleteCompanyDocData: mockDeleteCompanyDocData,
            isLoading: false,
        });
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocDownload,
        });
    });

    it('renders the component correctly', () => {
        render(<CompanyDocMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<CompanyDocMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for documents'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<CompanyDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens CompanyDocModal when "Add New Document" is clicked', () => {
        render(<CompanyDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('CompanyDocModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<CompanyDocMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('ul.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<CompanyDocMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

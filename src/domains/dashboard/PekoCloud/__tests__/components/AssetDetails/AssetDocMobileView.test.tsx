import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AssetDocMobileView from '../../../components/AssetDetails/AssetDocMobileView';
import { useDeleteAssetDocApi } from '../../../hooks/assetHooks/useDeleteAssetDocApi';

vi.mock('../../../hooks/assetHooks/useDeleteAssetDocApi', () => ({
    useDeleteAssetDocApi: vi.fn(),
}));
vi.mock('../../../components/AssetDetails/AssetDocMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetDocMobileCard</div>),
}));
vi.mock('../../../components/Modals/AssetDocumentModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetDocumentModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('AssetDocMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleDocDownload = vi.fn();
    const mockDeleteAssetDocData = vi.fn();

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
        (useDeleteAssetDocApi as any).mockReturnValue({
            deleteAssetDocData: mockDeleteAssetDocData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<AssetDocMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByText('Document Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<AssetDocMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for documents'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<AssetDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens AssetDocumentModal when "Add New Document" is clicked', () => {
        render(<AssetDocMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('AssetDocumentModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<AssetDocMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('ul.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<AssetDocMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

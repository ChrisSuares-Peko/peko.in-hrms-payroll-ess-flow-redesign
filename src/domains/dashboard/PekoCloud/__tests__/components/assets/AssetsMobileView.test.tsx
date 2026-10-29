import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AssetsMobileView from '../../../components/Assets/AssetsMobileView';
import { useDeleteAssetApi } from '../../../hooks/assetHooks/useDeleteAssetApi';

vi.mock('../../../hooks/assetHooks/useDeleteAssetApi', () => ({
    useDeleteAssetApi: vi.fn(),
}));
vi.mock('../../../components/Assets/AssetsMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetsMobileCard</div>),
}));
vi.mock('../../../components/Modals/AssetModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetModal</div>),
}));
vi.mock('../../../components/Modals/AssignAssetModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignAssetModal</div>),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
        </div>
    )),
}));

describe('AssetsMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteAssetData = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, assetName: 'Test Asset', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteAssetApi as any).mockReturnValue({
            deleteAssetData: mockDeleteAssetData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<AssetsMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for assets')).toBeInTheDocument();
        expect(screen.getByText('Add Asset')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByText('Asset Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<AssetsMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for assets'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<AssetsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens AssetModal when "Add Asset" is clicked', () => {
        render(<AssetsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Asset'));
        expect(screen.getByText('AssetModal')).toBeInTheDocument();
    });

    it('opens AssignAssetModal when "Assign Asset" is clicked', () => {
        render(<AssetsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<AssetsMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<AssetsMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

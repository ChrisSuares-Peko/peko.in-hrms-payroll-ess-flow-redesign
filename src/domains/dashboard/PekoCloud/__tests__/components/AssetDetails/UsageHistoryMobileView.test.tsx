import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsageHistoryMobileView from '../../../components/AssetDetails/UsageHistoryMobileView';
import { useDeleteUsageHistoryApi } from '../../../hooks/assetHooks/useDeleteUsageApi';

vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('../../../hooks/assetHooks/useDeleteUsageApi', () => ({
    useDeleteUsageHistoryApi: vi.fn(),
}));
vi.mock('../../../components/AssetDetails/UsageHistoryMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>UsageHistoryMobileCard</div>),
}));
vi.mock('../../../components/Modals/AssetUsageHistoryModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetUsageHistoryModal</div>),
}));
vi.mock('../../../components/Modals/AssignAssetModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignAssetModal</div>),
}));
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('UsageHistoryMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteUsageHistoryData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, employeeName: 'John Doe', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { assetId: 1 } });
        (useDeleteUsageHistoryApi as any).mockReturnValue({
            deleteUsageHistoryData: mockDeleteUsageHistoryData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for usage history')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByText('Employee Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for usage history'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens AssignAssetModal when "Assign Asset" is clicked', () => {
        render(<UsageHistoryMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(<UsageHistoryMobileView {...defaultProps} tableLoading />);
        const skeletons = container.querySelectorAll('ul.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<UsageHistoryMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});

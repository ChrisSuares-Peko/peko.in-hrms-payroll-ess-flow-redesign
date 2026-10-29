import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import UsageHistoryTab from '../../../components/AssetDetails/UsageHistoryTab';
import { useDeleteUsageHistoryApi } from '../../../hooks/assetHooks/useDeleteUsageApi';
import { useGetAllAssetUsageApi } from '../../../hooks/assetHooks/useListUsageApi';

// Mock dependencies
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: false })), // Adjust based on test needs
}));
vi.mock('../../../hooks/assetHooks/useDeleteUsageApi', () => ({
    useDeleteUsageHistoryApi: vi.fn(() => ({
        deleteUsageHistoryData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/assetHooks/useListUsageApi', () => ({
    useGetAllAssetUsageApi: vi.fn(() => ({
        tableDatas: [],
        orderCount: 0,
        tableLoading: false,
    })),
}));
vi.mock('../../../components/AssetDetails/UsageHistoryMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>UsageHistoryMobileView</div>),
}));
vi.mock('../../../components/Modals/AssetUsageHistoryModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetUsageHistoryModal</div>),
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
vi.mock('../../../utils/useFilter.ts', () => ({
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
    })),
}));

describe('UsageHistoryTab', () => {
    const mockHandleDeleteUsageHistory = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { assetId: 1 } });
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetAllAssetUsageApi as any).mockReturnValue({
            tableDatas: [
                {
                    employee: 'John Doe',
                    employeeEmail: 'john.doe@example.com',
                    assignDate: '2024-04-12',
                    returnDate: '',
                    returnStatus: 'Assigned',
                    remarks: '',
                    status: '',
                    actions: '',
                    id: '1',
                    empId: '123',
                },
            ],
            orderCount: 1,
            tableLoading: false,
        });
        (useDeleteUsageHistoryApi as any).mockReturnValue({
            deleteUsageHistoryData: mockHandleDeleteUsageHistory,
            isLoading: false,
        });
    });

    it('renders component correctly in desktop view', () => {
        render(<UsageHistoryTab />);
        expect(screen.getByPlaceholderText('Search for usage history')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<UsageHistoryTab />);
        expect(screen.getByText('UsageHistoryMobileView')).toBeInTheDocument();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllAssetUsageApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });
        const { container } = render(<UsageHistoryTab />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<UsageHistoryTab />);

        const search = screen.getByPlaceholderText(/Search for usage history/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
    });

    it('opens AssetUsageHistoryModal when editing usage history', () => {
        render(<UsageHistoryTab />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<UsageHistoryTab />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteUsageHistory).toHaveBeenCalled();
        });
    });
});

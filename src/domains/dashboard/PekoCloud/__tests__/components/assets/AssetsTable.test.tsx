import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Button, Space } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import AssetsTable from '../../../components/Assets/AssetsTable';
import { useDeleteAssetApi } from '../../../hooks/assetHooks/useDeleteAssetApi';

// Mock dependencies
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ xs: false })), // Adjust based on test needs
}));
vi.mock('../../../hooks/assetHooks/useDeleteAssetApi', () => ({
    useDeleteAssetApi: vi.fn(() => ({
        deleteAssetData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../components/Assets/AssetsMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetsMobileView</div>),
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
vi.mock('../../../utils/assets', () => ({
    assetsColumn: vi.fn((handleDelete, handleEdit) => [
        {
            title: 'Asset Name',
            dataIndex: 'assetName',
            key: 'assetName',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <Space size="middle">
                    <Button className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            onClick={() => handleDelete(record)}
                        />
                    </Button>
                    <Button className="border-0">
                        <EditOutlined
                            className="text-[#E30000]"
                            onClick={() => handleEdit(record)}
                        />
                    </Button>
                </Space>
            ),
        },
    ]),
}));

describe('AssetsTable', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteAssetData = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        reloadInfo: mockReloadInfo,
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, assetName: 'Test Asset', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useDeleteAssetApi as any).mockReturnValue({
            deleteAssetData: mockDeleteAssetData,
            isLoading: false,
        });
    });

    it('renders the component correctly in desktop view', () => {
        render(<AssetsTable {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for assets')).toBeInTheDocument();
        expect(screen.getByText('Add Asset')).toBeInTheDocument();
        expect(screen.getByText('Assign Asset')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<AssetsTable {...defaultProps} />);
        expect(screen.getByText('AssetsMobileView')).toBeInTheDocument();
    });

    it('opens AssetModal when "Add Asset" is clicked', () => {
        render(<AssetsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Asset'));
        expect(screen.getByText('AssetModal')).toBeInTheDocument();
    });

    it('opens AssignAssetModal when "Assign Asset" is clicked', () => {
        render(<AssetsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Asset'));
        expect(screen.getByText('AssignAssetModal')).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<AssetsTable {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockDeleteAssetData).toHaveBeenCalled();
        });
    });

    it('handles search input change', () => {
        render(<AssetsTable {...defaultProps} />);
        const search = screen.getByPlaceholderText('Search for assets');
        fireEvent.change(search, { target: { value: 'test' } });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('handles page change', () => {
        render(<AssetsTable {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });
});

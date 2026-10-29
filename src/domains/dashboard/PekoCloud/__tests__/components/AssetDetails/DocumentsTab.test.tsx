import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import DocumentsTab from '../../../components/AssetDetails/DocumentsTab';
import { useDeleteAssetDocApi } from '../../../hooks/assetHooks/useDeleteAssetDocApi';
import { useGetAllAssetDocApi } from '../../../hooks/assetHooks/useListAssetDocApi';

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
vi.mock('../../../hooks/assetHooks/useDeleteAssetDocApi', () => ({
    useDeleteAssetDocApi: vi.fn(() => ({
        deleteAssetDocData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/assetHooks/useListAssetDocApi', () => ({
    useGetAllAssetDocApi: vi.fn(() => ({
        tableDatas: [],
        orderCount: 0,
        tableLoading: false,
    })),
}));
vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../components/AssetDetails/AssetDocMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetDocMobileView</div>),
}));
vi.mock('../../../components/Modals/AssetDocumentModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetDocumentModal</div>),
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

describe('DocumentsTab', () => {
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteCompanyDoc = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useLocation as any).mockReturnValue({ state: { assetId: 1 } });
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useGetAllAssetDocApi as any).mockReturnValue({
            tableDatas: [
                {
                    id: '1',
                    document: 'docKey',
                    documentName: 'docName',
                    issueDate: '12-04-2024',
                    documentNumber: '23412424',
                },
            ],
            orderCount: 1,
            tableLoading: false,
        });
        (useDeleteAssetDocApi as any).mockReturnValue({
            deleteAssetDocData: mockHandleDeleteCompanyDoc,
            isLoading: false,
        });
    });

    it('renders component correctly in desktop view', () => {
        render(<DocumentsTab />);
        expect(screen.getByPlaceholderText('Search for document')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument(); // Ensure table is present
    });

    it('renders component correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<DocumentsTab />);
        expect(screen.getByText('AssetDocMobileView')).toBeInTheDocument();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllAssetDocApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });
        const { container } = render(<DocumentsTab />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<DocumentsTab />);

        const search = screen.getByPlaceholderText(/Search for document/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
    });

    it('opens AssetDocumentModal when "Add New Document" is clicked', () => {
        render(<DocumentsTab />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('AssetDocumentModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<DocumentsTab />);
        const record = { id: '1', document: 'docKey', documentName: 'docName' };
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<DocumentsTab />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteCompanyDoc).toHaveBeenCalled();
        });
    });
});

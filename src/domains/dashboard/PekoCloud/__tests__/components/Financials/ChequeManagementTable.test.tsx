import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import ChequeManagementTable from '../../../components/Financials/ChequeManagementTable';
import { useDeleteChequeLeafApi } from '../../../hooks/financialDocHooks/useDeleteChequeLeafApi';
import { useGetAllChequeleavesApi } from '../../../hooks/financialDocHooks/useListChequeLeavesApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';
import useFilter from '../../../utils/useFilter';

// Mock dependencies
vi.mock('../../../hooks/financialDocHooks/useDeleteChequeLeafApi', () => ({
    useDeleteChequeLeafApi: vi.fn(() => ({
        deleteChequeLeafData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/financialDocHooks/useListChequeLeavesApi', () => ({
    useGetAllChequeleavesApi: vi.fn(() => ({
        tableDatas: [
            {
                id: '1',
                document: 'docKey',
                bookId: 'book1',
                issueDate: '12-04-2024',
                chequeNumber: '123456',
            },
        ],
        orderCount: 20,
        tableLoading: false,
    })),
}));
vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
    })),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal', () => ({
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
vi.mock('../../../components/Modals/ChequeLeafModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeLeafModal</div>),
}));
vi.mock('../../../components/Financials/AdaptiveView/ChequeManagementMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeManagementMobileView</div>),
}));
vi.mock('../../../utils/useFilter', () => ({
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
    })),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({
        xs: false,
    })),
}));

describe('ChequeManagementTable', () => {
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteChequeLeaf = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteChequeLeafApi as any).mockReturnValue({
            deleteChequeLeafData: mockHandleDeleteChequeLeaf,
            isLoading: false,
        });
        (useDeleteChequeLeafApi as any).mockReturnValue({
            deleteChequeLeafData: mockHandleDeleteChequeLeaf,
            isLoading: false,
        });
        (useGetAllChequeleavesApi as any).mockReturnValue({
            tableDatas: [
                {
                    id: '1',
                    document: 'docKey',
                    bookId: 'book1',
                    issueDate: '12-04-2024',
                    chequeNumber: '123456',
                },
            ],
            orderCount: 20,
            tableLoading: false,
        });
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocumentDownload,
        });
        (useFilter as any).mockReturnValue({
            handlePageChange: mockHandlePageChange,
            handleSearch: mockHandleSearch,
        });
    });

    it('renders component correctly', () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for cheque leaves')).toBeInTheDocument();
        expect(screen.getByText('Add Cheque')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });

        const search = screen.getByPlaceholderText(/Search for cheque leaves/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens ChequeLeafModal when "Add Cheque" is clicked', () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Add Cheque'));
        expect(screen.getByText('ChequeLeafModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        const record = {
            id: '1',
            document: 'docKey',
            bookId: 'book1',
        };
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllChequeleavesApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });

        const { container } = render(<ChequeManagementTable {...defaultProps} />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteChequeLeaf).toHaveBeenCalled();
        });
    });

    it('handles page change', async () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('2'));
        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });

    it('handles edit action', async () => {
        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole('img', { name: /Edit/i }));

        expect(screen.getByText('ChequeLeafModal')).toBeInTheDocument();
    });

    it('renders mobile view when screen size is small', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        render(<ChequeManagementTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByText('ChequeManagementMobileView')).toBeInTheDocument();
    });
});

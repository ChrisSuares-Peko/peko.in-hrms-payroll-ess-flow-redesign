import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import ChequeBooksTable from '../../../components/Financials/ChequeBooksTable';
import { useDeleteChequeBookApi } from '../../../hooks/financialDocHooks/useDeleteChequeBookApi';
import { useGetAllChequeBooksApi } from '../../../hooks/financialDocHooks/useListChequeBooksApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';
import useFilter from '../../../utils/useFilter';

// Mock dependencies
vi.mock('../../../hooks/financialDocHooks/useDeleteChequeBookApi', () => ({
    useDeleteChequeBookApi: vi.fn(() => ({
        deleteChequeBookData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({
        xs: false,
    })),
}));
vi.mock('../../../hooks/financialDocHooks/useListChequeBooksApi', () => ({
    useGetAllChequeBooksApi: vi.fn(() => ({
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
vi.mock('../../../components/Modals/ChequeBookModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeBookModal</div>),
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
vi.mock('../../../components/Financials/AdaptiveView/ChequeBooksMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeBooksMobileView</div>),
}));
vi.mock('../../../utils/useFilter.ts');

describe('ChequeBooksTable', () => {
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteChequeBook = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteChequeBookApi as any).mockReturnValue({
            deleteChequeBookData: mockHandleDeleteChequeBook,
            isLoading: false,
        });
        (useGetAllChequeBooksApi as any).mockReturnValue({
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
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for cheque books')).toBeInTheDocument();
        expect(screen.getByText('Add Cheque Book')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });

        const search = screen.getByPlaceholderText(/Search for cheque books/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens ChequeBookModal when "Add Cheque Book" is clicked', () => {
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Add Cheque Book'));
        expect(screen.getByText('ChequeBookModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });
        const record = {
            id: '1',
            document: 'docKey',
            bookId: 'book1',
        };
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllChequeBooksApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });

        const { container } = render(<ChequeBooksTable {...defaultProps} />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteChequeBook).toHaveBeenCalled();
        });
    });

    it('handles page change', async () => {
        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('2'));
        screen.debug(undefined, 10000);
        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });

    it('renders mobile view when screen size is small', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        render(<ChequeBooksTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByText('ChequeBooksMobileView')).toBeInTheDocument();
    });
});

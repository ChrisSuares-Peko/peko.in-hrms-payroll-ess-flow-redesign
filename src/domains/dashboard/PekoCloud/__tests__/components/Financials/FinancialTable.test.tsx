import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import FinancialTable from '../../../components/Financials/FinancialTable';
import { useDeleteFinancialDocApi } from '../../../hooks/financialDocHooks/useDeleteFinancialDocApi';
import { useGetAllFinancialDocApi } from '../../../hooks/financialDocHooks/useListFinancialDocApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';
import useFilter from '../../../utils/useFilter';

// Mock dependencies
vi.mock('../../../hooks/financialDocHooks/useDeleteFinancialDocApi', () => ({
    useDeleteFinancialDocApi: vi.fn(() => ({
        deleteFinacialDocData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/financialDocHooks/useListFinancialDocApi', () => ({
    useGetAllFinancialDocApi: vi.fn(() => ({
        tableDatas: [
            {
                id: '1',
                document: 'docKey',
                documentName: 'Document 1',
                issueDate: '12-04-2024',
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
vi.mock('../../../utils/useFilter', () => ({
    default: vi.fn(() => ({
        handlePageChange: vi.fn(),
        handleSearch: vi.fn(),
    })),
}));
vi.mock('../../../components/Modals/FinancialModal', () => ({
    __esModule: true,
    default: vi.fn(({ open, handleCancel }) =>
        open ? (
            <div>
                FinancialModal{' '}
                <button onClick={handleCancel} type="button">
                    Close
                </button>
            </div>
        ) : null
    ),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit, isOpen }) =>
        isOpen ? (
            <div>
                ConfirmationModal{' '}
                <button type="button" onClick={handleSubmit}>
                    Yes
                </button>
            </div>
        ) : null
    ),
}));
vi.mock('../../../components/Financials/AdaptiveView/FinancialDocMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>FinancialDocMobileView</div>),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({
        xs: false,
    })),
}));

describe('FinancialTable', () => {
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteFinancialDoc = vi.fn();
    const mockReloadInfo = vi.fn();

    const defaultProps = {
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteFinancialDocApi as any).mockReturnValue({
            deleteFinacialDocData: mockHandleDeleteFinancialDoc,
            isLoading: false,
        });
        (useGetAllFinancialDocApi as any).mockReturnValue({
            tableDatas: [
                {
                    id: '1',
                    document: 'docKey',
                    documentName: 'Document 1',
                    issueDate: '12-04-2024',
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
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });

        const search = screen.getByPlaceholderText(/Search for documents/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens FinancialModal when "Add New Document" is clicked', () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('FinancialModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        const record = {
            document: 'docKey',
            documentName: 'Document 1',
            id: '1',
        };
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllFinancialDocApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });

        const { container } = render(<FinancialTable {...defaultProps} />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });

        fireEvent.click(screen.getByRole('img', { name: /Delete/i }));

        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteFinancialDoc).toHaveBeenCalled();
        });
    });

    it('handles page change', async () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByText('2'));
        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });

    it('handles edit action', async () => {
        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        fireEvent.click(screen.getByRole('img', { name: /Edit/i }));

        expect(screen.getByText('FinancialModal')).toBeInTheDocument();
    });

    it('renders mobile view when screen size is small', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        render(<FinancialTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByText('FinancialDocMobileView')).toBeInTheDocument();
    });
});

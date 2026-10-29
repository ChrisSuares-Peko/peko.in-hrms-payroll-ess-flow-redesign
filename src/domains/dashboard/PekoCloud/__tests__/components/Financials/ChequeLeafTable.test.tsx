import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import ChequeLeafTable from '../../../components/Financials/ChequeLeafTable';
import { useDeleteChequeLeafApi } from '../../../hooks/financialDocHooks/useDeleteChequeLeafApi';
import { useGetAllChequeleavesApi } from '../../../hooks/financialDocHooks/useListChequeLeavesApi';
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
vi.mock('../../../components/Financials/AdaptiveView/ChequeLeafMobileView.tsx', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeLeafMobileView</div>),
}));

describe('ChequeLeafTable', () => {
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDeleteChequeLeaf = vi.fn();

    const defaultProps = {
        chequeBookId: 'book1',
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
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
        (useFilter as any).mockReturnValue({
            handlePageChange: mockHandlePageChange,
            handleSearch: mockHandleSearch,
        });
        (useScreenSize as any).mockReturnValue({
            xs: false,
        });
    });

    it('renders component correctly', () => {
        render(<ChequeLeafTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByPlaceholderText('Search for cheque leaf')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<ChequeLeafTable {...defaultProps} />, { wrapper: MemoryRouter });

        const search = screen.getByPlaceholderText(/Search for cheque leaf/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('renders loading skeletons when tableLoading is true', () => {
        (useGetAllChequeleavesApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: true,
        });

        const { container } = render(<ChequeLeafTable {...defaultProps} />, {
            wrapper: MemoryRouter,
        });
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        (useGetAllChequeleavesApi as any).mockReturnValue({
            tableDatas: [],
            orderCount: 0,
            tableLoading: false,
        });
        render(<ChequeLeafTable {...defaultProps} />, { wrapper: MemoryRouter });
        const allNoDataTexts = screen.getAllByText('No data');

        const filtered = allNoDataTexts.filter(element => !element.closest('svg'));

        expect(filtered.length).toBeGreaterThan(0);
    });

    it('does not display empty state when there is data', () => {
        render(<ChequeLeafTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.queryByText('No data')).not.toBeInTheDocument();
    });

    it('renders mobile view when screen size is small', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        render(<ChequeLeafTable {...defaultProps} />, { wrapper: MemoryRouter });
        expect(screen.getByText('ChequeLeafMobileView')).toBeInTheDocument();
    });
});

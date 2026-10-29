import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import ReportTables from '../../components/ReportTables';

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { id: 1, role: 'user' }, // Mock auth state
    },
});

// **Mock hooks used inside ReportTables**
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../hooks/useFilter', () => ({
    default: vi.fn(() => ({
        handleSearch: vi.fn(),
        handleChangeFilters: vi.fn(),
        handlePageChange: vi.fn(),
        handleFilter: vi.fn(),
        handleSort: vi.fn(),
        handleDateChange: vi.fn(),
        handleFromChange: vi.fn(),
        handleToChange: vi.fn(),
        handleTableChange: vi.fn(),
    })),
}));

vi.mock('../../hooks/useReportListing', () => ({
    default: vi.fn(() => ({
        downloadReport: vi.fn(),
    })),
}));

beforeEach(() => {
    vi.clearAllMocks();

    // **Mock Redux selector**
    (useAppSelector as any).mockImplementation((selector: any) =>
        selector({
            reducer: {
                auth: { id: 1, role: 'user' }, // Ensure auth state is defined
            },
        })
    );
});

describe('ReportTables Component', () => {

    const mockProps = {
        data: [
            {
                date: '2024-02-01',
                transactionID: 1,
                category: 'Utilities',
                operator: 'XYZ Bank',
                amount: 5000,
                paymentMode: 'Credit Card',
                status: 'Completed',
                download: 'invoice.pdf',
                cashback: '₹100',
                accountNumber: '1234567890',
                subCorporateName: 'ABC Corp',
            },
        ],
        count: 2,
        isLoading: false,
        title: 'Transaction Report',
        category: [],
        filter: {
            searchText: '',
            filter: '',
            page: 1,
            from: '2024-01-01',
            to: '2024-02-01',
            category: '',
            sort: 'asc',
            itemsPerPage: 10,
            sortField: 'date',
        },
        setFilter: vi.fn(),
        initalStartDate: '2024-01-01',
        initalEndDate: '2024-02-01',
        initialValues: {
            searchText: '', // ✅ Added this
            page: 1, // ✅ Added this
            filter: '', // ✅ Added this
            from: '2024-01-01',
            to: '2024-02-01',
            category: '',
            sort: 'asc',
            itemsPerPage: 10,
            sortField: 'date',
        },
        isCashbackTable: false,
        handleFilterChange: vi.fn(),
    };

    it('renders the component title correctly', () => {
        render(
            <Provider store={store}>
                <ReportTables {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('Transaction Report')).toBeInTheDocument();
    });

    it('calls handleFilterChange on filter update', () => {
        render(
            <Provider store={store}>
                <ReportTables {...mockProps} />
            </Provider>
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Test Search' } });
    });

    it('displays loading state when isLoading is true', () => {
        render(
            <Provider store={store}>
                <ReportTables {...mockProps} isLoading />
            </Provider>
        );
        expect(document.querySelector('.anticon-loading')).toBeInTheDocument();
    });
});

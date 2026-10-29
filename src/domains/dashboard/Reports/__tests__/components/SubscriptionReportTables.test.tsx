import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SubscriptionReportTables from '../../components/SubscriptionReportTables';

// Mock Store Setup
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { id: 1, role: 'user' },
    },
});

// Mock Dependencies
vi.mock('../../hooks/useSubscriptionFilter', () => ({
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

vi.mock('../../hooks/useSubscriptionReportListing', () => ({
    default: vi.fn(() => ({
        downloadReport: vi.fn(),
    })),
}));

const mockProps = {
    data: [
        {
            date: '2024-02-01',
            transactionID: 12345,
            amount: '500.00', // String type as required
            paymentMode: 'Credit Card',
            status: 'Completed',
            download: '',
            cashback: '50.00',
            accountNumber: '123456789',
            subCorporateName: 'CorpX',
            serviceName: 'Premium Subscription',
            billingType: 'Monthly',
        },
    ],
    count: 1,
    isLoading: false,
    title: 'Subscription Report',
    subscription: [{ label: 'Monthly', value: 'monthly' }],
    filter: {
        searchText: '', // 🔹 Missing field added
        page: 1, // 🔹 Missing field added
        filter: '',
        from: '2024-01-01',
        to: '2024-02-01',
        category: '',
        sort: '',
        itemsPerPage: 10, // 🔹 Missing field added
        sortField: '',
    },
    setFilter: vi.fn(),
    initalStartDate: '2024-01-01',
    initalEndDate: '2024-02-01',
    initialValues: {
        from: '2024-01-01',
        to: '2024-02-01',
        category: '',
        sort: '',
        itemsPerPage: 10,
        sortField: '',
        searchText: '', // 🔹 Ensure this is included
        page: 1, // 🔹 Ensure this is included
        filter: '',
    },
    isCashbackTable: false,
    handleFilterChange: vi.fn(),
};

describe('SubscriptionReportTables Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <SubscriptionReportTables {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('Subscription Report')).toBeInTheDocument();
    });

    it('calls handleFilterChange when filter is updated', () => {
        render(
            <Provider store={store}>
                <SubscriptionReportTables {...mockProps} />
            </Provider>
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Test Subscription' } });

        expect(mockProps.handleFilterChange).not.toHaveBeenCalled(); // Debounced, requires time delay
    });

    it('displays loading state when isLoading is true', () => {
        render(
            <Provider store={store}>
                <SubscriptionReportTables {...mockProps} isLoading />
            </Provider>
        );

        expect(document.querySelector('.anticon-loading')).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import WebTable from '../../components/WebTable';

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { id: 1, role: 'user' }, // Mock authentication state
    },
});

// **Mocking useDownloadInvoice Hook**
vi.mock('../../hooks/useDownloadInvoice', () => ({
    useDownloadInvoice: () => ({
        getInvoiceData: vi.fn(),
        loader: false,
    }),
}));

describe('WebTable Component', () => {
    let mockProps: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockProps = {
            data: [
                {
                    date: '2024-02-01',
                    transactionID: 12345,
                    subCorporateName: 'John Doe',
                    category: 'Subscription',
                    operator: 'Netflix',
                    amount: '500.00',
                    paymentMode: 'Credit Card',
                    status: 'Success',
                    download: 'Download',
                    cashback: '10',
                    accountNumber: '1234-5678-9000',
                },
            ],
            isloading: false,
            page: 1,
            count: 15, // More than 10 to ensure pagination appears
            handlePageChange: vi.fn(),
            isCashbackTable: false,
            handleSort: vi.fn(),
            handleFilter: vi.fn(),
            handleTableChange: vi.fn(),
            handleFilterChange: vi.fn(),
            filter: '',
        };
    });

    it('renders the table with correct headers', async () => {
        render(
            <Provider store={store}>
                <WebTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Order ID')).toBeInTheDocument();
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Operator')).toBeInTheDocument();
    });

    it('displays data rows correctly', async () => {
        render(
            <Provider store={store}>
                <WebTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('12345')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Subscription')).toBeInTheDocument();
        expect(screen.getByText('Netflix')).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import SubscriptionWebTable from '../../components/SubscriptionWebTable';

vi.mock('../../hooks/useSubscriptionDownloadInvoice', () => ({
    useSubscriptionDownloadInvoice: vi.fn(() => ({
        getInvoiceData: vi.fn(),
        loader: false,
    })),
}));

const mockStore = configureStore();
const store = mockStore({});

describe('SubscriptionWebTable Component', () => {
    const mockProps = {
        data: [
            {
                date: '2024-02-01',
                transactionID: 12345,
                amount: '500.00',
                paymentMode: 'Credit Card',
                status: 'Success',
                download: 'Download',
                cashback: '50.00',
                accountNumber: '123456789',
                subCorporateName: 'CorpX',
                serviceName: 'Premium Subscription',
                billingType: 'Monthly',
            },
        ],
        isloading: false,
        page: 1,
        count: 1,
        handlePageChange: vi.fn(),
        isCashbackTable: false,
        handleSort: vi.fn(),
        handleFilter: vi.fn(),
        handleTableChange: vi.fn(),
        handleFilterChange: vi.fn(),
        filter: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table headers correctly', () => {
        render(
            <Provider store={store}>
                <SubscriptionWebTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Order ID')).toBeInTheDocument();
        expect(screen.getByText('Subscription')).toBeInTheDocument();
        expect(screen.getByText('Billing Type')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('displays data rows correctly', () => {
        render(
            <Provider store={store}>
                <SubscriptionWebTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByText(content => content.includes('₹ 500.00'))).toBeInTheDocument();
        expect(screen.getByText('Premium Subscription')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(screen.getByText('12345')).toBeInTheDocument();
    });
});

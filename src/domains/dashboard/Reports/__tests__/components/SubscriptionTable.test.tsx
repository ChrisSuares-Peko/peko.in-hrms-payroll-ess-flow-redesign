import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import SubscriptionTable from '../../components/SubscriptionTable';

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(),
}));

vi.mock('../../components/SubscriptionMobileTable', () => ({
    default: () => <div data-testid="mobile-table">Mobile Table</div>,
}));

vi.mock('../../components/SubscriptionWebTable', () => ({
    default: () => <div data-testid="web-table">Web Table</div>,
}));

const mockStore = configureStore();
const store = mockStore({});

describe('SubscriptionTable Component', () => {
    const mockProps = {
        data: [
            {
                date: '2024-02-01',
                transactionID: 12345,
                amount: '500.00',
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
        isLoading: false,
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

    it('renders the mobile table when screen size is small', () => {
        (useScreenSize as unknown as any).mockReturnValue({ xs: true });

        render(
            <Provider store={store}>
                <SubscriptionTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByTestId('mobile-table')).toBeInTheDocument();
    });

    it('renders the web table when screen size is large', () => {
        (useScreenSize as unknown as any).mockReturnValue({ xs: false });

        render(
            <Provider store={store}>
                <SubscriptionTable {...mockProps} />
            </Provider>
        );

        expect(screen.getByTestId('web-table')).toBeInTheDocument();
    });

    it('passes correct props to SubscriptionWebTable', () => {
        (useScreenSize as unknown as any).mockReturnValue({ xs: false });

        render(
            <Provider store={store}>
                <SubscriptionTable {...mockProps} />
            </Provider>
        );

        expect(mockProps.handlePageChange).not.toHaveBeenCalled();
        expect(mockProps.handleSort).not.toHaveBeenCalled();
        expect(mockProps.handleFilter).not.toHaveBeenCalled();
    });

    it('passes correct props to SubscriptionMobileTable', () => {
        (useScreenSize as unknown as any).mockReturnValue({ xs: true });

        render(
            <Provider store={store}>
                <SubscriptionTable {...mockProps} />
            </Provider>
        );

        expect(mockProps.handlePageChange).not.toHaveBeenCalled();
    });
});

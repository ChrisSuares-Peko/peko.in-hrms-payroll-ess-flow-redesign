import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HistoryTable from '../../components/order-history/HistoryTable';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

vi.mock('../../hooks/useOrderHistoryApi');

const mockStore = configureStore();
const store = mockStore({});

describe('HistoryTable Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the table with orders', () => {
        (useOrderHistoryApi as unknown as any).mockReturnValue({
            orders: [
                {
                    date: '2024-02-10T12:00:00Z',
                    plan: 'Premium',
                    transactionId: '12345',
                    billingCycle: 'monthly',
                    amount: '1200',
                    status: 'complete',
                },
            ],
            isLoading: false,
            count: 1,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <HistoryTable fromDate="2024-01-01" toDate="2024-02-01" />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('₹ 1200.00')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays loading state when fetching data', () => {
        (useOrderHistoryApi as unknown as any).mockReturnValue({
            orders: [],
            isLoading: true,
            count: 0,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <HistoryTable fromDate="2024-01-01" toDate="2024-02-01" />
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByText('No data', { selector: '.ant-empty-description' })
        ).toBeInTheDocument();
    });

    it('updates page number when pagination is clicked', () => {
        (useOrderHistoryApi as unknown as any).mockReturnValue({
            orders: [],
            isLoading: false,
            count: 50,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <HistoryTable fromDate="2024-01-01" toDate="2024-02-01" />
                </MemoryRouter>
            </Provider>
        );

        const nextPageButton = screen.getByText('2').closest('li');
        // @ts-ignore
        fireEvent.click(nextPageButton);
        expect(nextPageButton).toHaveClass('ant-pagination-item-active');
    });
});

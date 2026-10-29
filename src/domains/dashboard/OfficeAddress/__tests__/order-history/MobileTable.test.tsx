import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import MobileTable from '../../components/order-history/MobileTable';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

vi.mock('../../hooks/useOrderHistoryApi');

const mockStore = configureStore();
const store = mockStore({});

describe('MobileTable Component', () => {
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
                    status: 'complete',
                },
            ],
            isLoading: false,
            count: 1,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <MobileTable />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Premium')).toBeInTheDocument();
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
                    <MobileTable />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Order History')).toBeInTheDocument();
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
                    <MobileTable />
                </MemoryRouter>
            </Provider>
        );

        const nextPageButton = screen.getByText('2').closest('li');
        fireEvent.click(nextPageButton!);
        expect(nextPageButton).toHaveClass('ant-pagination-item-active');
    });
});

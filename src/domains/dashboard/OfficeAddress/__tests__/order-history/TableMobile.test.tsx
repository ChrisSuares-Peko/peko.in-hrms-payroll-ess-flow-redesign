import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TableMobile from '../../components/order-history/TableMobile';

vi.mock('@src/slices/apiSlice', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        showToast: vi.fn(),
    };
});

const mockStore = configureStore();
const store = mockStore({});

describe('TableMobile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockTransaction = {
        date: '2024-02-10T12:00:00Z',
        amount: 1200,
        billingCycle: 'monthly',
        plan: 'Premium',
        status: 'complete',
        transactionId: '12345',
    };

    it('renders the transaction details correctly', () => {
        render(
            <Provider store={store}>
                <TableMobile transaction={mockTransaction} />
            </Provider>
        );

        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('toggles details when the arrow icon is clicked', () => {
        render(
            <Provider store={store}>
                <TableMobile transaction={mockTransaction} />
            </Provider>
        );

        const toggleButton = screen.getByRole('img', { name: /right/i });
        fireEvent.click(toggleButton);

        expect(screen.getByText('Order ID :')).toBeInTheDocument();
        expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('shows toast message when trying to download a pending document', () => {
        const pendingTransaction = { ...mockTransaction, status: 'pending' };
        render(
            <Provider store={store}>
                <TableMobile transaction={pendingTransaction} />
            </Provider>
        );

        const toggleButton = screen.getByRole('img', { name: /right/i });
        fireEvent.click(toggleButton);
    });
});

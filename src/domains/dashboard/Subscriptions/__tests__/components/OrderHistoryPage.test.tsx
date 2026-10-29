import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';

import { createTestStore } from '@store/store';

import OrderHistoryPage from '../../components/orderHistory/OrderHistoryPage';
import * as useOrderHistoryTableModule from '../../hooks/useOrderHistoryTable';

describe('OrderHistoryPage Component', () => {
    const mockData = [
        {
            transactionId: 'TX123456789',
            subscriptionName: 'Premium Plan',
            status: 'SUCCESS',
            dateandtime: '2024-08-22T14:30:00Z',
            paymentMode: 'credit card',
            amount: '1000',
            plan: 'Premium',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders correctly and displays the table with data', () => {
        vi.spyOn(useOrderHistoryTableModule, 'useOrderHistoryTable').mockReturnValue({
            data: mockData,
            isLoading: false,
            count: 0,
        });
        render(<OrderHistoryPage />);

        expect(screen.getByText(/Order History/i)).toBeInTheDocument();
        expect(screen.getByText(/Premium Plan/i)).toBeInTheDocument();
        expect(screen.getByText(/INR 1,000/i)).toBeInTheDocument();
        expect(screen.getByText(/SUCCESS/i)).toBeInTheDocument();
    });

    it('renders pagination elements correctly', () => {
        render(
            <Provider store={createTestStore({})}>
                <OrderHistoryPage />
            </Provider>
        );

        const prevButton = screen.getByTitle('Previous Page');
        const nextButton = screen.getByTitle('Next Page');

        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
    });

    it('displays empty message when no data is available', () => {
        vi.spyOn(useOrderHistoryTableModule, 'useOrderHistoryTable').mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryPage />);
        screen.debug(undefined, 20000);
        expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
    });
});

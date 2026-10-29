import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import HistoryTable from '../../../components/OrderHistory/HistoryTable';
import { useOrderHistoryApi } from '../../../hooks/useOrderHistoryApi';
import { OrderTableItem } from '../../../type/orderHistory';

vi.mock('../../../hooks/useOrderHistoryApi', () => ({
    useOrderHistoryApi: vi.fn(),
}));

const mockOrders: OrderTableItem[] = [
    {
        id: 1,
        date: '2024-02-12T12:00:00Z',
        workName: 'Work A',
        planName: 'Plan X',
        transactionId: 'TXN123',
        amount: '500.00',
        status: 'completed',
        paymentMode: '',
        paymentStatus: ''
    },
    {
        id: 2,
        date: '2024-02-10T14:30:00Z',
        workName: 'Work B',
        planName: 'Plan Y',
        transactionId: 'TXN456',
        amount: '750.50',
        status: 'pending',
        paymentMode: '',
        paymentStatus: ''
    },
];

describe('HistoryTable Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table with fetched orders', async () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: mockOrders,
            isLoading: false,
            count: 2,
        });

        render(
            <BrowserRouter>
                <HistoryTable fromDate="2024-01-01" toDate="2024-02-12" />
            </BrowserRouter>
        );

        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Work Name')).toBeInTheDocument();
        expect(screen.getByText('Plan Name')).toBeInTheDocument();
        expect(screen.getByText('Order ID')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('View')).toBeInTheDocument();

        await waitFor(() => expect(screen.getByText('Work A')).toBeInTheDocument());
        expect(screen.getByText('Plan X')).toBeInTheDocument();
        expect(screen.getByText('TXN123')).toBeInTheDocument();
        expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getAllByText('View Details')).toHaveLength(mockOrders.length);
    });

    it('shows loading state when data is being fetched', () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: [],
            isLoading: true,
            count: 0,
        });

        render(
            <BrowserRouter>
                <HistoryTable fromDate="2024-01-01" toDate="2024-02-12" />
            </BrowserRouter>
        );

        expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('updates page when pagination is clicked', async () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: mockOrders,
            isLoading: false,
            count: 20,
        });

        render(
            <BrowserRouter>
                <HistoryTable fromDate="2024-01-01" toDate="2024-02-12" />
            </BrowserRouter>
        );

        const nextPageButton = screen.getByTitle('Next Page');
        expect(nextPageButton).toBeInTheDocument();

        fireEvent.click(nextPageButton);
        await waitFor(() => {
            expect(screen.getByText('Work A')).toBeInTheDocument();
        });
    });
});

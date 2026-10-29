import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, beforeEach, afterEach, it, expect, vi, Mock } from 'vitest';

import BillingHistory from '../../../components/billingHistory/BillingHistory';
import { useFetchOrders } from '../../../hooks/useFetchOrders';

vi.mock('../../../hooks/useFetchOrders', () => ({
    useFetchOrders: vi.fn(),
}));

describe('BillingHistory Component', () => {
    let mockLoadOrders: Mock;

    beforeEach(() => {
        mockLoadOrders = vi.fn();
        (useFetchOrders as Mock).mockReturnValue({
            isLoading: false,
            orders: [
                {
                    id: '12345',
                    transactionDate: '2024-02-12T10:30:00Z',
                    paymentMode: 'PAYMENT GATEWAY',
                    amountInINR: '500.5',
                    status: 'SUCCESS',
                },
                {
                    id: '67890',
                    transactionDate: '2024-02-11T14:15:00Z',
                    paymentMode: 'UPI',
                    amountInINR: '1000',
                    status: 'FAILED',
                },
            ],
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalOrders: 20,
            },
            loadOrders: mockLoadOrders,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render the BillingHistory component', () => {
        render(<BillingHistory />);
        expect(screen.getByText('Top Up History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search for orders')).toBeInTheDocument();
    });

    it('should call loadOrders on mount with default params', () => {
        render(<BillingHistory />);
        expect(mockLoadOrders).toHaveBeenCalledWith('', 1, 10);
    });

    it('should display loading state correctly', () => {
        (useFetchOrders as Mock).mockReturnValue({
            isLoading: true,
            orders: [],
            pagination: { currentPage: 1, pageSize: 10, totalOrders: 0 },
            loadOrders: mockLoadOrders,
        });

        render(<BillingHistory />);
        expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('should update search state when typing and trigger API call', async () => {
        render(<BillingHistory />);
        const searchInput = screen.getByPlaceholderText('Search for orders');

        fireEvent.change(searchInput, { target: { value: 'Order A' } });

        await waitFor(() => {
            expect(mockLoadOrders).toHaveBeenCalledWith('Order A', 1, 10);
        });
    });

    it('should update the page when pagination is changed', async () => {
        render(<BillingHistory />);
        const paginationNextButton = screen.getByTitle('2'); // Assuming default Ant Pagination titles

        fireEvent.click(paginationNextButton);

        await waitFor(() => {
            expect(mockLoadOrders).toHaveBeenCalledWith('', 2, 10);
        });
    });

    it('renders table columns correctly', () => {
        const { getByText } = render(<BillingHistory />);

        expect(getByText('Order ID')).toBeInTheDocument();
        expect(getByText('Order Date')).toBeInTheDocument();
        expect(getByText('Order Type')).toBeInTheDocument();
        expect(getByText('Payment Mode')).toBeInTheDocument();
        expect(getByText('Amount')).toBeInTheDocument();
        expect(getByText('Status')).toBeInTheDocument();

        expect(getByText('12345')).toBeInTheDocument();
        expect(getByText('67890')).toBeInTheDocument();
        expect(getByText('Card Payment')).toBeInTheDocument();
        expect(getByText('UPI')).toBeInTheDocument();
        expect(getByText('500.50')).toBeInTheDocument();
        expect(getByText('1000.00')).toBeInTheDocument();
        expect(getByText('• Success')).toBeInTheDocument();
        expect(getByText('• Failure')).toBeInTheDocument();
    });
});

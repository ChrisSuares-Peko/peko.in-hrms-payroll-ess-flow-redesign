import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, Mock, test, vi } from 'vitest';

import { formattedDateTime } from '@utils/dateFormat';

import HistoryTableMobile from '../../../components/OrderHistory/HistoryTableMobile';
import { useOrderHistoryApi } from '../../../hooks/useOrderHistoryApi';

vi.mock('../../../hooks/useOrderHistoryApi', () => ({
    useOrderHistoryApi: vi.fn(),
}));
vi.mock('antd', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        Spin: () => <div data-testid="loading-spinner">Loading...</div>,
    };
});

const mockOrders = [
    {
        id: 1,
        amount: '500.00',
        status: 'completed',
        date: '2024-02-12T10:00:00Z',
        planName: 'Plan A',
    },
    {
        id: 2,
        amount: '1000.00',
        status: 'pending',
        date: '2024-02-11T12:00:00Z',
        planName: 'Plan B',
    },
];

describe('HistoryTableMobile Component', () => {
    test('renders loading spinner while fetching data', () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: [],
            isLoading: true,
            count: 0,
        });

        render(<HistoryTableMobile fromDate="2024-02-01" toDate="2024-02-10" />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('renders order list correctly', async () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: mockOrders,
            isLoading: false,
            count: mockOrders.length,
        });

        render(<HistoryTableMobile fromDate="2024-02-01" toDate="2024-02-10" />, {
            wrapper: MemoryRouter,
        });

        // Ensure order details are displayed
        await waitFor(() => {
            expect(screen.getByText('₹ 500.00')).toBeInTheDocument();
            expect(screen.getByText('completed')).toBeInTheDocument();
            expect(
                screen.getByText(`Ordered On: ${formattedDateTime(new Date(mockOrders[0].date))}`)
            ).toBeInTheDocument();
            expect(screen.getByText('Plan Name: Plan A')).toBeInTheDocument();
        });

        expect(screen.getByText('₹ 1000.00')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(
            screen.getByText(`Ordered On: ${formattedDateTime(new Date(mockOrders[1].date))}`)
        ).toBeInTheDocument();
        expect(screen.getByText('Plan Name: Plan B')).toBeInTheDocument();
    });

    test('navigates to order details when clicking the button', async () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: mockOrders,
            isLoading: false,
            count: mockOrders.length,
        });

        render(<HistoryTableMobile fromDate="2024-02-01" toDate="2024-02-10" />, {
            wrapper: MemoryRouter,
        });

        const buttons = screen.getAllByRole('link');

        // Ensure both links exist
        expect(buttons).toHaveLength(mockOrders.length);
        expect(buttons[0]).toHaveAttribute('href', `/order-details/1`);
        expect(buttons[1]).toHaveAttribute('href', `/order-details/2`);
    });

    test('handles pagination changes', async () => {
        (useOrderHistoryApi as Mock).mockReturnValue({
            orders: mockOrders,
            isLoading: false,
            count: 20,
        });

        render(<HistoryTableMobile fromDate="2024-02-01" toDate="2024-02-10" />, {
            wrapper: MemoryRouter,
        });

        const paginationButtons = screen.getAllByRole('button');

        expect(paginationButtons.length).toBeGreaterThan(1); // Ensure pagination is rendered

        fireEvent.click(paginationButtons[1]); // Simulate clicking page 2
    });
});

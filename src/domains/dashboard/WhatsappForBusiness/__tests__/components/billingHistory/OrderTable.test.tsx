import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import OrdersTable from '../../../components/billingHistory/OrderTable';
import useFilter from '../../../hooks/useFilter';
import usePurchaseHistory from '../../../hooks/usePurchaseHistory';

vi.mock('../../../hooks/usePurchaseHistory', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('../../../hooks/useFilter', () => ({
    __esModule: true,
    default: vi.fn(() => ({ handlePageChange: vi.fn() })),
}));

describe('OrdersTable Component', () => {
    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders loading state', () => {
        (usePurchaseHistory as Mock).mockReturnValue({
            data: [],
            isLoading: true,
            count: 0,
            refetch: mockRefetch,
        });

        render(<OrdersTable refresh={false} setRefresh={vi.fn()} />);

        // expect(screen.getByText(/subscription history/i)).toBeInTheDocument();
        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    test('renders table with data', async () => {
        (usePurchaseHistory as Mock).mockReturnValue({
            data: [
                {
                    id: 'INV-001',
                    subscriptionStartDate: new Date('2024-01-10T10:30:00Z'),
                    package: { packageName: 'Premium Plan' },
                    subscriptionAmountPaid: 4999,
                    status: 'ACTIVE',
                },
            ],
            isLoading: false,
            count: 1,
            refetch: mockRefetch,
        });

        render(<OrdersTable refresh={false} setRefresh={vi.fn()} />);

        expect(await screen.findByText(/INV-001/i)).toBeInTheDocument();
        expect(await screen.findByText(/Premium Plan/i)).toBeInTheDocument();
        expect(await screen.findByText(/ACTIVE/i)).toBeInTheDocument();
        expect(await screen.findByText(/INR 4,999.00/i)).toBeInTheDocument();
    });

    test('calls refetch when refresh is triggered', async () => {
        const setRefreshMock = vi.fn();
        (usePurchaseHistory as Mock).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
            refetch: mockRefetch,
        });

        const { rerender } = render(<OrdersTable refresh setRefresh={setRefreshMock} />);

        await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
        expect(setRefreshMock).toHaveBeenCalledWith(false);

        rerender(<OrdersTable refresh={false} setRefresh={setRefreshMock} />);
    });

    test('handles pagination change', () => {
        const mockHandlePageChange = vi.fn();
        (useFilter as Mock).mockReturnValue({ handlePageChange: mockHandlePageChange });
        (usePurchaseHistory as Mock).mockReturnValue({
            data: [
                {
                    id: 'INV-002',
                    subscriptionStartDate: new Date('2024-02-05T15:45:00Z'),
                    package: { packageName: 'Basic Plan' },
                    subscriptionAmountPaid: 1999,
                    status: 'EXPIRED',
                },
            ],
            isLoading: false,
            count: 10,
            refetch: mockRefetch,
        });

        render(<OrdersTable refresh={false} setRefresh={vi.fn()} />);

        fireEvent.click(screen.getByTitle(/next page/i));

        expect(mockHandlePageChange).toHaveBeenCalled();
    });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OrderHistoryPage from '../../components/OrderHistoryTable';
import useFilter from '../../hooks/useFilter';
import { useOrderHistoryTable } from '../../hooks/useOrderHistoryTable';

// Mock hooks
vi.mock('../../hooks/useOrderHistoryTable');
vi.mock('../../hooks/useFilter');
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
}));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn().mockReturnValue(vi.fn()),
}));

describe('OrderHistoryPage Component', () => {
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();

    beforeEach(() => {
        vi.mocked(useFilter).mockReturnValue({
            handleSearch: mockHandleSearch,
            handlePageChange: mockHandlePageChange,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryPage />);
        expect(screen.getByText('Order History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('displays loading state when data is being fetched', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: true,
            count: 0,
        });

        render(<OrderHistoryPage />);
        expect(document.querySelector('.ant-spin')).toBeTruthy();
    });

    it('renders order history items when data is available', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [
                {
                    date: '2024-02-07',
                    giftCardName: 'Amazon Gift Card',
                    txnId: 'TXN123',
                    paymentMode: 'UPI',
                    amount: '500',
                    status: 'SUCCESS',
                    orderType: '',
                    quantity: 0,
                },
            ],
            isLoading: false,
            count: 1,
        });

        render(<OrderHistoryPage />);

        expect(screen.getByText('Amazon Gift Card')).toBeInTheDocument();
        expect(screen.getByText('TXN123')).toBeInTheDocument();
        expect(screen.getByText(/₹\s*500\.00/)).toBeInTheDocument();
        expect(screen.getByText('success')).toBeInTheDocument();
    });

    it('handles search input changes', async () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryPage />);
        const searchInput = screen.getByPlaceholderText('Search');

        fireEvent.change(searchInput, { target: { value: 'Amazon' } });

        await waitFor(() => {
            expect(mockHandleSearch).toHaveBeenCalled();
        });
    });

    it('handles pagination changes', async () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [
                {
                    date: '2024-02-07',
                    giftCardName: 'Amazon Gift Card',
                    txnId: 'TXN123',
                    paymentMode: 'UPI',
                    amount: '500',
                    status: 'SUCCESS',
                    orderType: '',
                    quantity: 0,
                },
            ],
            isLoading: false,
            count: 50,
        });

        render(<OrderHistoryPage />);

        const pagination = screen.getByTitle('Next Page');

        pagination.click();

        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });
});

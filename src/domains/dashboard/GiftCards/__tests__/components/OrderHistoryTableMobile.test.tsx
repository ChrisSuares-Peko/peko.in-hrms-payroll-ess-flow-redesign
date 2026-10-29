import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OrderHistoryTableMobile from '../../components/OrderHistoryTableMobile';
import useFilter from '../../hooks/useFilter';
import { useOrderHistoryTable } from '../../hooks/useOrderHistoryTable';

// Mock hooks
vi.mock('../../hooks/useOrderHistoryTable');
vi.mock('../../hooks/useFilter');

describe('OrderHistoryTableMobile Component', () => {
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();

    beforeEach(() => {
        vi.mocked(useFilter).mockReturnValue({
            handleSearch: mockHandleSearch,
            handlePageChange: mockHandlePageChange,
        });
    });

    it('renders the component correctly', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryTableMobile />);
        expect(screen.getByText('Purchase History')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('shows loading state when data is being fetched', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: true,
            count: 0,
        });

        render(<OrderHistoryTableMobile />);

        // Check if an element with the Ant Design Skeleton class exists
        expect(document.querySelector('.ant-skeleton')).toBeTruthy();
    });

    it('displays "No data available" when no records are found', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryTableMobile />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders order history items when data is available', () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [
                {
                    status: 'Success', // ✅ Ensure status is a string
                    amount: '100',
                    date: '2024-02-01',
                    txnId: '',
                    paymentMode: '',
                    giftCardName: '',
                    orderType: '',
                    quantity: 0,
                },
            ],
            isLoading: false,
            count: 1,
        });

        render(<OrderHistoryTableMobile />);

        expect(screen.getByText(/success/i)).toBeInTheDocument(); // Check if status is displayed
    });

    it('handles search input changes', async () => {
        render(<OrderHistoryTableMobile />);
        const searchInput = screen.getByPlaceholderText('Search');

        fireEvent.change(searchInput, { target: { value: 'Test Search' } });

        await waitFor(() => {
            expect(mockHandleSearch).toHaveBeenCalled();
        });
    });

    it('handles pagination changes', async () => {
        vi.mocked(useOrderHistoryTable).mockReturnValue({
            data: [
                {
                    status: 'Success',
                    amount: '100',
                    date: '2024-02-07',
                    txnId: '',
                    paymentMode: '',
                    giftCardName: '',
                    orderType: '',
                    quantity: 1,
                },
            ],
            isLoading: false,
            count: 50,
        });

        render(<OrderHistoryTableMobile />);
        const pagination = screen.getByTitle('Next Page');

        pagination.click();

        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });
});

import { SetStateAction } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import useFilter from '../../../hooks/useFilter';
import { useAllpaymentLinks } from '../../../hooks/useGetAllPaymentLinksApi';
import OrderHistoryTable from '../../../pages/paymentLinks/OrderHistory';

// Mocking custom hooks
vi.mock('../../../hooks/useGetAllPaymentLinksApi');
vi.mock('../../../hooks/useFilter');

describe('OrderHistoryTable', () => {
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    beforeEach(() => {
        (useAllpaymentLinks as Mock).mockReturnValue({
            tableData: [],
            count: 0,
            isLoading: false,
            statisticsData: {},
            resendPaymentLink: vi.fn(),
        });
        vi.mocked(useFilter).mockReturnValue({
            handleSearch: mockHandleSearch,
            handlePageChange: mockHandlePageChange,
            searchText: '',
            setSearchText(value: SetStateAction<string>): void {
                throw new Error('Function not implemented.');
            },
        });
    });

    it('should render card data correctly', () => {
        (useAllpaymentLinks as Mock).mockReturnValueOnce({
            tableData: [],
            count: 0,
            isLoading: false,
            statisticsData: {
                total: 100,
                used: 50,
            },
            resendPaymentLink: vi.fn(),
        });

        render(<OrderHistoryTable />);
        expect(screen.getByText(/Total Number of Payment Links Sent/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Amount Received/i)).toBeInTheDocument();
    });

    it('should display the table with correct data', () => {
        const mockData = [
            {
                id: '1',
                createdAt: '2024-02-17T10:30:00Z',
                sentPayload: { full_name: 'John Doe' },
                reference_id: 'PAY123456',
                amount: '5000',
                status: 'paid',
                paymentLink: 'https://payment.example.com/pay/123456',
            },
            {
                id: '2',
                createdAt: '2024-02-16T14:45:00Z',
                sentPayload: { full_name: 'Jane Smith' },
                reference_id: 'PAY654321',
                amount: '2500',
                status: 'pending',
                paymentLink: 'https://payment.example.com/pay/654321',
            },
        ];

        (useAllpaymentLinks as Mock).mockReturnValueOnce({
            tableData: mockData,
            count: 2,
            isLoading: false,
            statisticsData: {},
            resendPaymentLink: vi.fn(),
        });

        render(<OrderHistoryTable />);

        expect(screen.getByText(/PAY654321/i)).toBeInTheDocument();
        expect(screen.getByText(/PAY123456/i)).toBeInTheDocument();
    });

    it('should paginate correctly', async () => {
        (useAllpaymentLinks as Mock).mockReturnValueOnce({
            tableData: [],
            count: 20,
            isLoading: false,
            statisticsData: {},
            resendPaymentLink: vi.fn(),
        });

        render(<OrderHistoryTable />);

        const pagination = screen.getByTitle('Next Page');

        pagination.click();

        await waitFor(() => {
            expect(mockHandlePageChange).toHaveBeenCalled();
        });
    });

    it('should show loading state when data is loading', () => {
        (useAllpaymentLinks as Mock).mockReturnValueOnce({
            tableData: [],
            count: 0,
            isLoading: true,
            statisticsData: {},
            resendPaymentLink: vi.fn(),
        });

        render(<OrderHistoryTable />);

        expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
});

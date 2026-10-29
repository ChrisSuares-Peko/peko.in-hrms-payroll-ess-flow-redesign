import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { RangePickerTimeProps } from 'antd/es/time-picker';
import { DatePickerProps } from 'antd/lib';
import { Dayjs } from 'dayjs';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import OrderHistoryTableMobile from '../../components/orderHistory/OrderHistoryTableMobile';
import * as useFilterModule from '../../hooks/useFilter';
import * as useOrderHistoryTableModule from '../../hooks/useOrderHistoryTable'; // Import the module

type RangePickerOnChange = NonNullable<RangePickerTimeProps<Dayjs>['onChange']>;
type DatePickerOnChange = NonNullable<DatePickerProps['onChange']>;

const handleSearchMock = vi.fn();

// Mock the useFilter hook
// vi.mock('../../../hooks/useFilter', () => ({
//   __esModule: true,
//   default: vi.fn().mockReturnValue({
//     handleSearch: handleSearchMock,
//     handlePageChange: vi.fn(),
//   }),
// }));

describe('OrderHistoryTableMobile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    const mockData = [
        {
            transactionId: '12345',
            dateandtime: '2024-08-25T12:34:56Z',
            paymentMode: 'Credit Card',
            subscriptionName: 'Basic Plan',
            amount: '10.00',
            status: 'Active',
            plan: 'Plant Details',
        },
    ];

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state correctly', () => {
        vi.spyOn(useOrderHistoryTableModule, 'useOrderHistoryTable').mockReturnValue({
            data: [],
            isLoading: true,
            count: 0,
        });

        const { container } = render(<OrderHistoryTableMobile searchText="" />);

        // Check for the presence of the skeleton loader using the container
        const skeletonLoader = container.querySelector('.ant-skeleton');
        expect(skeletonLoader).toBeInTheDocument();

        // You can also check for specific elements within the skeleton loader
        const skeletonTitle = container.querySelector('.ant-skeleton-title');
        expect(skeletonTitle).toBeInTheDocument();

        const skeletonParagraphs = container.querySelectorAll('.ant-skeleton-paragraph li');
        expect(skeletonParagraphs.length).toBeGreaterThan(0);
    });

    it('renders empty state correctly', () => {
        vi.spyOn(useOrderHistoryTableModule, 'useOrderHistoryTable').mockReturnValue({
            data: [],
            isLoading: false,
            count: 0,
        });

        render(<OrderHistoryTableMobile searchText="" />);

        // Check if Empty component is rendered
        expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('renders data correctly', () => {
        vi.spyOn(useOrderHistoryTableModule, 'useOrderHistoryTable').mockReturnValue({
            data: mockData,
            isLoading: false,
            count: mockData.length,
        });
        render(<OrderHistoryTableMobile searchText="" />);
        expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });

    it('handles search input change', async () => {
        vi.spyOn(useFilterModule, 'default').mockReturnValue({
            handleSearch: handleSearchMock,
            handlePageChange: vi.fn(),
            handleDateChange(
                _dates: Parameters<RangePickerOnChange>[0],
                _dateStrings: Parameters<RangePickerOnChange>[1]
            ): void {
                throw new Error('Function not implemented.');
            },
            handleFromChange(
                _date: Parameters<DatePickerOnChange>[0],
                _dateString: Parameters<DatePickerOnChange>[1]
            ): void {
                throw new Error('Function not implemented.');
            },
            handleToChange(
                _date: Parameters<DatePickerOnChange>[0],
                _dateString: Parameters<DatePickerOnChange>[1]
            ): void {
                throw new Error('Function not implemented.');
            },
        });
        render(<OrderHistoryTableMobile searchText="" />);

        const searchInput = screen.getByPlaceholderText('Search for orders');
        fireEvent.change(searchInput, { target: { value: 'Test' } });

        await waitFor(() => {
            expect(handleSearchMock).toHaveBeenCalled();
            // Adjust the assertion to match the structure of SyntheticBaseEvent
            expect(handleSearchMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        value: 'Test',
                    }),
                })
            );
        });
    });
});

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi } from 'vitest';

import CancelBooking from '@src/domains/dashboard/Hotels/Components/BookingHistory/CancelBooking';
import { Scope } from '@src/enums/enums';

// Mock dependencies
vi.mock('@src/domains/dashboard/Hotels/Api/index', () => ({
    getotp: vi.fn(),
}));
vi.mock('@src/domains/dashboard/Hotels/hooks/useBookingCancelApi', () => ({
    default: vi.fn(() => ({
        cancelBooked: vi.fn(),
        loader: false,
    })),
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(value => value.toString()),
}));

// Define the mock store with an auth reducer
const mockStore = configureStore({
    reducer: {
        reducer: () => ({
            auth: {
                id: '123',
                role: 'user',
            },
        }),
    },
});

describe('CancelBooking Component', () => {
    const defaultProps = {
        orderId: 1,
        isModalOpen: true,
        handleCancel: vi.fn(),
        charges: [
            {
                FromDate: '23-01-2025 12:00',
                ChargeType: 'Fixed',
                CancellationCharge: 100,
            },
            {
                FromDate: '22-01-2025 12:00',
                ChargeType: 'Percentage',
                CancellationCharge: 20,
            },
        ],
        baseAmt: 1000,
        refetch: vi.fn(),
        isLoading: false,
    };

    it('should render the modal with correct details', () => {
        render(
            <Provider store={mockStore}>
                <CancelBooking txnId="" {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('Confirm Cancellation')).toBeInTheDocument();
        expect(screen.getByText('Cancellation Charges')).toBeInTheDocument();
        expect(screen.getByText('Amount to be refunded')).toBeInTheDocument();
    });

    it('should calculate refund amount correctly', () => {
        render(
            <Provider store={mockStore}>
                <CancelBooking txnId="" {...defaultProps} />
            </Provider>
        );

        const refundAmount = screen.getByTestId('amount');
        expect(refundAmount).toHaveTextContent('₹ 900'); // Base amount - fixed charge
    });

    it('should handle cancel booking flow', async () => {
        const { getotp } = await import('@src/domains/dashboard/Hotels/Api/index');
        // @ts-ignore
        getotp.mockResolvedValue(true);

        render(
            <Provider store={mockStore}>
                <CancelBooking txnId="" {...defaultProps} />
            </Provider>
        );

        const cancelButton = screen.getByText('Cancel Booking');
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(getotp).toHaveBeenCalledWith({
                userId: '123',
                userType: 'user',
                scope: Scope.EMAIL,
            });
        });
    });

    it('should show an OTP modal when OTP is sent', async () => {
        const { getotp } = await import('@src/domains/dashboard/Hotels/Api/index');
        // @ts-ignore
        getotp.mockResolvedValue(true);

        render(
            <Provider store={mockStore}>
                <CancelBooking txnId="" {...defaultProps} />
            </Provider>
        );

        const cancelButton = screen.getByText('Cancel Booking');
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.getByText('Confirmation')).toBeInTheDocument();
        });
    });
});

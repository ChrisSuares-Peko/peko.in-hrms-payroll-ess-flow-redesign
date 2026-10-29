import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';
import Manage from '@src/domains/dashboard/Hotels/Components/BookingHistory/Manage';

const mockDispatch = vi.fn();

const initialState = {
    reducer: {
        hotels: {
            hotelsRequest: {
                rooms: [],
            },
            corporateTxnId: null,
        },
        auth: {
            role: 'user',
            id: '123',
        },
        user: {
            user: { name: 'Test User' },
        },
    },
};

const mockStore = configureStore({
    reducer: (state = initialState) => state,
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: any) => selector(initialState)
}));

vi.mock('@src/slices/apiSlice', async (importOriginal: () => Promise<any>) => {
    const actual = await importOriginal();
    return {
        ...(actual as Record<string, any>), 
        showToast: vi.fn().mockImplementation(({ description }: any) => {
            const toast = document.createElement('div');
            toast.textContent = description;
            document.body.appendChild(toast);
        }),
    };
});


vi.mock('@src/slices/getHotelSlice', () => ({
    getTxnId: vi.fn(),
}));

vi.mock('@domains/dashboard/Hotels/hooks/useCancellationApi', () => ({
    default: vi.fn(() => ({
        cancellation: vi.fn().mockResolvedValue({ data: [] }),
        isLoading: false,
    })),
}));

vi.mock('@domains/dashboard/Hotels/hooks/useDownloadTicketApi', () => ({
    default: vi.fn(() => ({
        download: vi.fn().mockResolvedValue({
            pdfFile: { data: [] },
        }),
    })),
}));

vi.mock('@domains/dashboard/Hotels/hooks/useTimeConvertHook', () => ({
    default: vi.fn(() => ({
        convertToAMPM: vi.fn(time => time),
    })),
}));

vi.mock('@domains/dashboard/Hotels/hooks/useDateField', () => ({
    default: vi.fn(() => ({
        showModal: vi.fn(),
        isModalOpen: false,
        handleCancel: vi.fn(),
    })),
}));

describe('Manage Component', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const defaultProps = {
        orderId: 123,
        details: JSON.stringify({
            hotelBookingDetails: {
                checkInDate: '2024-08-20',
                checkOutDate: '2024-08-22',
                CancelPolicies: [],
                TotalRooms: 2,
                LastCancellationDate: '2024-08-18',
                HotelName: 'Test Hotel',
                HotelImage: '',
            },
            bookingDetailsResponse: {
                HotelRoomsDetails: [
                    {
                        HotelPassenger: [
                            {
                                Age: 30,
                                FirstName: 'John',
                                LastName: 'Doe',
                                Email: 'john@example.com',
                                Phoneno: '1234567890',
                            },
                        ],
                    },
                ],
            },
            PassengerTypes: [
                {
                    passengers: [
                        { name: 'John Doe', age: 30 },
                        { name: 'Jane Doe', age: 28 },
                    ],
                },
            ],
            BookingRefNo: 'ABC123',
            bookingStatus: 'CONFIRMED',
        }),
        txnId: 'txn123',
        baseAmt: 1000,
        refetch: vi.fn(),
    };

    it('should render the Manage component with correct details', () => {
        render(
            <Provider store={mockStore}>
                <Router>
                    <Manage
                        downloadTicketLoading={false}
                        setDownloadedTicketLoading={vi.fn()} 
                        txnDate=""
                        {...defaultProps}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText(/2024-08-20/)).toBeInTheDocument();
        expect(screen.getByText(/2024-08-22/)).toBeInTheDocument();
        expect(screen.getByText(/Booking Number:/i)).toBeInTheDocument();
    });

    it('should handle ticket download', async () => {
        render(
            <Provider store={mockStore}>
                <Router>
                    <Manage
                        downloadTicketLoading={false}
                        setDownloadedTicketLoading={vi.fn()} 
                        txnDate=""
                        {...defaultProps}
                    />
                </Router>
            </Provider>
        );

        const downloadButton = screen.getByText('Download');
        fireEvent.click(downloadButton);

        await waitFor(() => {
            expect(screen.getByText('Download')).toBeInTheDocument();
        });
    });
});

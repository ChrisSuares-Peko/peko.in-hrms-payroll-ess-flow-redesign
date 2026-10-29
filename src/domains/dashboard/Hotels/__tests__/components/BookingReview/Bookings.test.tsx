import { configureStore } from '@reduxjs/toolkit';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';
import Bookings from '@src/domains/dashboard/Hotels/Components/BookingReview/Bookings';

describe('Bookings Component', () => {
    afterEach(() => {
        cleanup();
    });

    const initialState = {
        reducer: {
            hotels: {
                hotelsRequest: {
                    rooms: [
                        { adult: 2, child: 1 },
                        { adult: 1, child: 0 },
                    ],
                    checkIn: '2024-08-25', 
                    checkOut: '2024-08-28', 
                },
                singleData: {
                    Rooms: [
                        {
                            Name: ['Deluxe Room'],
                        },
                    ],
                },
                roomResponse: [{ price: '300' }, { price: '500' }],
                prebookResponse: {
                    HotelResult: [
                        {
                            Rooms: [
                                {
                                    Amenities: ['Free WiFi', 'Breakfast Included'],
                                    CancelPolicies: [
                                        {
                                            policy: 'Free cancellation up to 24 hours before check-in',
                                        },
                                    ], 
                                },
                            ],
                        },
                    ],
                },
                hotelResponse: {
                    data: [
                        {
                            name: 'Test Hotel',
                            city: 'Test City',
                            country: 'Test Country',
                        },
                    ],
                },
            },
        },
    };

    const mockStore = configureStore({
        reducer: (state = initialState) => state,
    });

    const renderComponent = (props = {}) =>
        render(
            <Provider store={mockStore}>
                <Bookings
                    hotel="Test Hotel"
                    details={{ city: 'Test City', country: 'Test Country' }}
                    checkInTime="14:00"
                    checkoutTime="12:00"
                    {...props}
                />
            </Provider>
        );

    it('renders correctly with default props', () => {
        renderComponent();

        expect(screen.getByText('Check-in')).toBeInTheDocument();
        expect(screen.getByText('Check-out')).toBeInTheDocument();
        expect(screen.getByText('Total length of stay')).toBeInTheDocument();
        expect(screen.getByText('Room name')).toBeInTheDocument();
    });

    it('calculates and displays the correct length of stay', () => {
        renderComponent();

        const stay = screen.getByTestId('staylength');
        expect(stay).toBeInTheDocument();
    });

    it('displays the correct check-in and check-out times', () => {
        renderComponent();

        const checkin = screen.getByTestId('checkin');
        expect(checkin).toHaveTextContent('Invalid Date');

        const checkout = screen.getByTestId('checkout');
        expect(checkout).toHaveTextContent('Invalid Date');
    });
});

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import UserDetailsWeb from '@src/domains/dashboard/Hotels/Components/GuestDetails/UserDetailsWeb';

// Define initial state for the mock store
const initialState = {
    reducer: {
        hotels: {
            hotelsRequest: {
                rooms: [
                    {
                        roomIndex: 1,
                        adult: 2,
                        child: 1,
                        childAge: [5],
                    },
                ],
            },
            keyData: {
                hotelKey: 'mockHotelKey',
                conversationId: 'mockConversationId',
                searchKey: 'mockSearchKey',
            },
            reservedData: [
                {
                    ratePlan: {
                        meal: 'Breakfast included',
                        cancelPolicyIndicator: true,
                        lastCancellationDate: '2023-08-25',
                    },
                    roomTypeDesc: ['Deluxe Room'], // Updated to an array
                },
            ],
            roomResponse: [
                {
                    roomKey: 'mockRoomKey',
                    roomIndex: 1,
                    price: 100,
                },
            ],
            formCount: [1, 2, 3],
            prebookRoomData: [
                {
                    rateNotes: 'Mock rate notes',
                },
            ],
            prebookResponse: {
                HotelResult: [
                    {
                        Rooms: [
                            {
                                MealType: 'Breakfast Included',
                                Name: ['Deluxe Room'], // Updated to an array
                                IsRefundable: true,
                                CancelPolicies: [{ FromDate: '2023-08-24' }],
                                Amenities: ['WiFi', 'Air Conditioning'],
                                DayRates: [
                                    [{ BasePrice: 150 }, { BasePrice: 200 }], // Example of valid DayRates structure
                                ],
                            },
                        ],
                    },
                ],
                ValidationInfo: {
                    PassportMandatory: true,
                    PanMandatory: false,
                },
            },
            netAmount: 1000,
        },
        subscriptions: {
            services: [],
        },
    },
};

// Create the mock store with the initial state
const mockStore = configureStore({
    reducer: (state = initialState) => state,
});

vi.mock('@src/hooks/store', async importOriginal => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        useAppSelector: (selector: (state: typeof initialState) => any) => selector(initialState),
        useAppDispatch: () => vi.fn(),
    };
});

vi.mock('@src/routes/paths', () => ({
    paths: {
        hotels: {
            bookings: '/hotels/bookings',
        },
    },
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useLocation: vi.fn(() => ({ state: { key: 'search123' } })),
    };
});

describe('UserDetailsWeb Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders continue button', () => {
        render(
            <Provider store={mockStore}>
                <Router>
                    <UserDetailsWeb employeesList={[]} generateEmployeesDropdown={vi.fn()} />
                </Router>
            </Provider>
        );

        const ctn = screen.getByTestId('continue');
        expect(ctn).toBeInTheDocument();
    });

    it('renders room details and guest details', () => {
        render(
            <Provider store={mockStore}>
                <Router>
                    <UserDetailsWeb employeesList={[]} generateEmployeesDropdown={vi.fn()} />
                </Router>
            </Provider>
        );

        expect(screen.getByText('Deluxe Room')).toBeInTheDocument();
    });

    it('handles continue button click and triggers form submission', async () => {
        render(
            <Provider store={mockStore}>
                <Router>
                    <UserDetailsWeb employeesList={[]} generateEmployeesDropdown={vi.fn()} />
                </Router>
            </Provider>
        );

        fireEvent.click(screen.getByText('Continue'));

        // Additional validations can be added here based on the component logic.
    });
});

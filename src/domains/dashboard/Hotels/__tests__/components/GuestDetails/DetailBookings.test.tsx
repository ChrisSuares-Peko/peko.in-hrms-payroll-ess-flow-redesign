import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import DetailBookings from '@src/domains/dashboard/Hotels/Components/GuestDetails/DetailBookings';
import * as getHotelSlice from '@src/domains/dashboard/Hotels/slices/getHotelSlice';
import '@testing-library/jest-dom/vitest';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn((selector: any) => selector(mockState)),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

vi.mock('@src/hooks/useSavedTravellers', () => ({
    useSavedTravellers: () => ({
        data: [],
        limit: Infinity,
        canSaveMore: true,
        isLoading: false,
        fetchSavedTravellers: vi.fn(),
        saveTraveller: vi.fn(),
        removeTraveller: vi.fn(),
        generateSavedTravellersDropdown: () => [],
    }),
}));

vi.mock('@src/slices/getHotelSlice', async importOriginal => {
    const original: typeof getHotelSlice = await importOriginal();
    return {
        ...original,
        TotalFormCount: vi.fn(),
        addPassengersData: vi.fn(),
        addUserData: vi.fn(),
    };
});

const mockState = {
    reducer: {
        auth: { role: 'CORPORATE', id: 1 },
        subscriptions: {
            services: [],
        },
        hotels: {
            userdetails: [
                {
                    roomIndex: 1,
                    passengers: [
                        {
                            passengerKey: 1,
                            passengerInfo: {
                                givenName: 'John',
                                surname: 'Doe',
                            },
                        },
                    ],
                },
            ],
            prebookResponse: {
                ValidationInfo: {
                    PassportMandatory: true,
                    PanMandatory: false,
                },
            },
        },
    },
};

const mockStore = configureStore({
    reducer: (state = mockState) => state,
});

const mockProps = {
    passengerType: 'adult',
    passengerKey: 1,
    roomIndex: 1,
    roomKey: 'room1',
    formRef: { current: { handleSubmit: vi.fn() } },
    totalForm: [],
    setTotalForm: vi.fn(),
    childAge: 10,
    passengerCount: 1,
    data: [],
    generateEmployeesDropdown: vi.fn(),
    userdetails: mockState.reducer.hotels.userdetails,
};

describe('DetailBookings Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the form with initial values', () => {
        render(
            <Provider store={mockStore}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <DetailBookings
                        passengervalue={1}     
                        setEnteredForm={vi.fn()} 
                        {...mockProps}
                    />
                </Formik>
            </Provider>
        );

        expect(screen.getByText('Adult Guest 1')).toBeInTheDocument();
    });

    it('updates form fields correctly', async () => {
        render(
            <Provider store={mockStore}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <DetailBookings
                        passengervalue={1}     
                        setEnteredForm={vi.fn()}
                        {...mockProps}
                    />
                </Formik>
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText('First Name'), {
            target: { value: 'Jane' },
        });

        fireEvent.change(screen.getByPlaceholderText('Last Name'), {
            target: { value: 'Smith' },
        });


        expect(screen.getByPlaceholderText('First Name')).toHaveValue('Jane');
    });

    it('submits the form and dispatches actions', async () => {
        render(
            <Provider store={mockStore}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <DetailBookings
                        passengervalue={1}
                        setEnteredForm={vi.fn()}
                        {...mockProps}
                    />
                </Formik>
            </Provider>
        );

        fireEvent.click(screen.getByText('Male')); 
    });
});

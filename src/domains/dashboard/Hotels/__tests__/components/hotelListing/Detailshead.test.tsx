import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom';
import Detailshead from '@src/domains/dashboard/Hotels/Components/HotelListing/Detailshead';

const initialState = {
    reducer: {
        hotels: {
            hotelsRequest: {
                City: 'Dubai',
                country: 'United Arab Emirates',
                CheckIn: '2024-08-20',
                CheckOut: '2024-08-22',
                rooms: [{ adult: 2, child: 1, childAge: [5] }],
            },
            nationality: 'IN',
            countryOfResidence: 'India',
        },
        auth: {
            role: 'user',
            id: '123',
        },
    },
};

const mockStore = configureStore({
    reducer: (state = initialState) => state,
});

vi.mock('@src/hooks/useDateField', () => ({
    __esModule: true,
    default: () => ({
        showModal: vi.fn(),
        handleCancel: vi.fn(),
        isModalOpen: false,
    }),
}));

vi.mock('@src/hooks/useSearchCityApi', () => ({
    __esModule: true,
    default: () => ({
        isLoading: false,
        cityList: vi.fn(),
        cityOptions: [{ label: 'Dubai', value: 'Dubai' }],
    }),
}));

vi.mock('@src/slices/apiSlice', async importOriginal => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        showToast: vi.fn(({ description }) => {
            const toastElement = document.createElement('div');
            toastElement.textContent = description;
            document.body.appendChild(toastElement);
        }),
    };
});

vi.mock('@src/slices/getHotelSlice', () => ({
    getHotels: vi.fn(),
    resetHotelArr: vi.fn(),
}));

describe('Detailshead Component', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const renderWithProviderAndRouter = (ui: React.ReactNode) => {
        render(
            <Provider store={mockStore}>
                <MemoryRouter>{ui}</MemoryRouter>
            </Provider>
        );
    };

    it('should render all fields correctly', () => {
        renderWithProviderAndRouter(<Detailshead hotelsSearch={vi.fn()} isLoading={false} />);

        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Check-in')).toBeInTheDocument();
        expect(screen.getByText('Check-out')).toBeInTheDocument();
        expect(screen.getByText('No. of Rooms and Guests')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('should display the correct initial data', () => {
        renderWithProviderAndRouter(<Detailshead hotelsSearch={vi.fn()} isLoading={false} />);
        expect(screen.getByText('1 Room, 3 Guests')).toBeInTheDocument();
       expect(screen.getByDisplayValue('20 Aug 2024')).toBeInTheDocument()
        expect(screen.getByDisplayValue('22 Aug 2024')).toBeInTheDocument();
    });

    it('should trigger hotels search when data is valid', async () => {
        const hotelsSearchMock = vi.fn();
        renderWithProviderAndRouter(
            <Detailshead hotelsSearch={hotelsSearchMock} isLoading={false} />
        );

        fireEvent.click(screen.getByText('Search'));

        await waitFor(() => {
            expect(hotelsSearchMock).toHaveBeenCalledWith({
                City: 'Dubai',
                CheckIn: '2024-08-20',
                CheckOut: '2024-08-22',
                GuestNationality: 'IN',
            });
        });
    });

});

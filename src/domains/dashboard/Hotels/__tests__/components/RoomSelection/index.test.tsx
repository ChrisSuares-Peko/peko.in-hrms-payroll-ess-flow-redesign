import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import HotelList from '@domains/dashboard/Hotels/Components/HotelListing/HotelList';

const mockStore = configureStore([]);
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

describe('HotelList Component', () => {
    const defaultStore = {
        reducer: {
            hotels: {
                hotelPriceRange: {
                    lowestPrice: 1000,
                    highestPrice: 10000,
                },
            },
        },
    };

    const renderWithProvider = (component: JSX.Element, storeData = defaultStore) => {
        const store = mockStore(storeData);
        return render(
            <Provider store={store}>
                <MemoryRouter>{component}</MemoryRouter>
            </Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render hotel details', () => {
        renderWithProvider(
            <HotelList
                hotelKey="hotel1"
                image="https://example.com/hotel.jpg"
                name="Hotel A"
                facilities="Free WiFi, Parking"
                reviews={4}
                price={5000}
                conversationId="123"
                items={{ key: 'value' }}
            />
        );

        expect(screen.getByText('Hotel A')).toBeInTheDocument();
        expect(screen.getByText('Free WiFi, Parking')).toBeInTheDocument();

        expect(screen.getByText('Includes taxes and charges')).toBeInTheDocument();
    });

    it('should display the correct star rating', () => {
        renderWithProvider(
            <HotelList
                hotelKey="hotel3"
                image="https://example.com/hotel.jpg"
                name="Hotel C"
                facilities="Restaurant, Gym"
                reviews={5}
                price={7000}
                conversationId="789"
                items={{ key: 'value' }}
            />
        );

        const activeStars = screen.getAllByLabelText('star'); // Count filled stars
        expect(activeStars).toHaveLength(10);
    });

    it('should call navigate and dispatch actions when "Select Rooms" is clicked', () => {
        renderWithProvider(
            <HotelList
                hotelKey="hotel4"
                image="https://example.com/hotel.jpg"
                name="Hotel D"
                facilities="Breakfast Included"
                reviews={4}
                price={8000}
                conversationId="012"
                items={{ key: 'value' }}
            />
        );

        const selectRoomsButton = screen.getByText('Select Rooms');
        fireEvent.click(selectRoomsButton);

        expect(mockDispatch).toHaveBeenCalledTimes(4);
        expect(mockNavigate).toHaveBeenCalledWith('hotel-details', { state: { key: 'formData' } });
    });
});

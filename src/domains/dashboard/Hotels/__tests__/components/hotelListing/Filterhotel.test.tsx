import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi } from 'vitest';

import Filterhotel from '@domains/dashboard/Hotels/Components/HotelListing/Filterhotel';

const mockStore = configureStore([]);

describe('Filterhotel Component', () => {
    const mockSetFilteredData = vi.fn();
    const mockSetCurrentPage = vi.fn();

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
        return render(<Provider store={store}>{component}</Provider>);
    };

    it('should render the component with title', () => {
        renderWithProvider(
            <Filterhotel
                title="Filter"
                dataSource={[]}
                setFilteredData={mockSetFilteredData}
                setCurrentPage={mockSetCurrentPage}
                sortOption="priceLowToHigh"
            />
        );

        expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should update price range when slider is moved', () => {
        renderWithProvider(
            <Filterhotel
                title="Filter"
                dataSource={[]}
                setFilteredData={mockSetFilteredData}
                setCurrentPage={mockSetCurrentPage}
                sortOption="priceLowToHigh"
            />
        );

        const sliders = screen.getAllByRole('slider'); // Get both slider handles
        expect(sliders).toHaveLength(2);

        // Simulate moving the first slider handle
        fireEvent.mouseDown(sliders[0], { clientX: 100 });
        fireEvent.mouseMove(sliders[0], { clientX: 200 });
        fireEvent.mouseUp(sliders[0]);

        // Simulate moving the second slider handle
        fireEvent.mouseDown(sliders[1], { clientX: 300 });
        fireEvent.mouseMove(sliders[1], { clientX: 400 });
        fireEvent.mouseUp(sliders[1]);

        // Verify the callback was called
        expect(mockSetFilteredData).toHaveBeenCalled();
    });

    it('should filter by property name', () => {
        const mockData = [
            {
                Rooms: [{ TotalFare: 3000 }],
                HotelName: 'Hotel A',
            },
            {
                Rooms: [{ TotalFare: 4000 }],
                HotelName: 'Hotel B',
            },
        ];

        renderWithProvider(
            <Filterhotel
                title="Filter"
                dataSource={mockData}
                setFilteredData={mockSetFilteredData}
                setCurrentPage={mockSetCurrentPage}
                sortOption="priceLowToHigh"
            />
        );

        const input = screen.getByPlaceholderText('Search by hotel name');
        fireEvent.change(input, { target: { value: 'Hotel A' } });

        expect(mockSetFilteredData).toHaveBeenCalledWith(
            expect.arrayContaining([{ Rooms: [{ TotalFare: 3000 }], HotelName: 'Hotel A' }])
        );
    });

    it('should strip emojis from the hotel name search input', () => {
        renderWithProvider(
            <Filterhotel
                title="Filter"
                dataSource={[]}
                setFilteredData={mockSetFilteredData}
                setCurrentPage={mockSetCurrentPage}
                sortOption="priceLowToHigh"
            />
        );

        const input = screen.getByPlaceholderText('Search by hotel name') as HTMLInputElement;
        fireEvent.change(input, { target: { value: '🏨Hotel😀 A🔥' } });

        expect(input.value).toBe('Hotel A');
    });

    it('should reset all filters when Reset is clicked', () => {
        renderWithProvider(
            <Filterhotel
                title="Filter"
                dataSource={[]}
                setFilteredData={mockSetFilteredData}
                setCurrentPage={mockSetCurrentPage}
                sortOption="priceLowToHigh"
            />
        );

        const resetButton = screen.getByText('Reset');
        fireEvent.click(resetButton);

        expect(mockSetFilteredData).toHaveBeenCalled();
        expect(mockSetCurrentPage).toHaveBeenCalledWith(1);
    });
});

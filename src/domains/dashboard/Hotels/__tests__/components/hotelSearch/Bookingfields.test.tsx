import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

import Bookingfields from '@src/domains/dashboard/Hotels/Components/HotelSearch/Bookingfields';

dayjs.extend(weekday);
dayjs.extend(localeData);


vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(), // Mock dispatch
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'user', id: '123' }, // Mocked auth state
                hotels: {
                    hotelsRequest: {
                        rooms: [{ adult: 2, child: 1 }], // Mocked hotel request state
                    },
                },
            },
        }),
}));

vi.mock('../../hooks/useDateField', () => ({
    useDateFields: () => ({
        showModal: vi.fn(),
        handleCancel: vi.fn(),
        isModalOpen: false,
    }),
}));

vi.mock('../../hooks/useSearchCityApi', () => ({
    useSearchCityApi: () => ({
        cityList: vi.fn(),
        cityOptions: [{ cityName: 'Dubai', countryName: 'United Arab Emirates' }],
    }),
}));

vi.mock('../../hooks/useSearchCountryApi', () => ({
    useSearchCountryApi: () => ({
        countryList: vi.fn(),
        countryOptions: [{ label: 'India', value: 'IN' }],
    }),
}));

vi.mock('../../hooks/useTimeConvertHook', () => ({
    useTimeConvert: () => ({
        convertToDateString: (date: any) => date,
    }),
}));

vi.mock('@src/slices/getHotelSlice', () => ({
    getHotels: vi.fn(),
    resetData: vi.fn(),
    resetRoomResponse: vi.fn(),
    resetGetHotels: vi.fn(),
    resetHotelArr: vi.fn(),
    resetNationality: vi.fn(),
    resetResidence: vi.fn(),
    resetSearchKey: vi.fn(),
    resetUserData: vi.fn(),
    resetTotalForms: vi.fn(),
    setSearchKey: vi.fn(),
}));

vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(), // Mock the dispatch function
    useSelector: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: () => ({
            state: { key: 'mockedKey' }, // Mocked location state
        }),
    };
});

describe('Bookingfields Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should render all fields correctly', () => {
        render(<Bookingfields />);
        expect(screen.getByText('Country')).toBeInTheDocument();
        expect(screen.getByText('Check-in')).toBeInTheDocument();
        expect(screen.getByText('Check-out')).toBeInTheDocument();
        expect(screen.getByText('Guests')).toBeInTheDocument();
        expect(screen.getByText('Search Hotels')).toBeInTheDocument();
    });

    it('should update check-in and check-out dates', async () => {
        render(<Bookingfields />);
        // @ts-ignore
        const checkInInput = screen.getByText('Check-in').nextSibling?.querySelector('input');
        // @ts-ignore
        const checkOutInput = screen.getByText('Check-out').nextSibling?.querySelector('input');

        if (checkInInput && checkOutInput) {
            fireEvent.change(checkInInput, { target: { value: '2024-08-20' } });
            fireEvent.change(checkOutInput, { target: { value: '2024-08-22' } });

            await waitFor(() => {
                expect(checkInInput).toHaveValue('2024-08-20');
                expect(checkOutInput).toHaveValue('2024-08-22');
            });
        }
    });

   

    it('should handle country selection', async () => {
        render(<Bookingfields />);
        const countrySelect = screen.getByPlaceholderText('Enter Country');
        fireEvent.change(countrySelect, { target: { value: 'IN' } });

        await waitFor(() => {
            expect(countrySelect).toHaveValue('IN');
        });
    });
});

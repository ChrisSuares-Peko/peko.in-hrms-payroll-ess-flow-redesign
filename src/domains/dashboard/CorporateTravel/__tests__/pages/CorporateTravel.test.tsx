import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CorporateTravel from '../../pages/CorporateTravel';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'user', id: 1 },
                activeTab: { corporateTravelActiveTab: '1' },
            },
        }),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/corporate-travel', state: null }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ sm: true, xs: false }),
}));

vi.mock('@components/molecular/corporate-travel-card/CorporateTravelCard', () => ({
    default: () => <div data-testid="corporate-travel-card" />,
}));

vi.mock('../../../Airline/components/SearchFlight', () => ({
    default: () => <div data-testid="search-flight">SearchFlight</div>,
}));

vi.mock('../../../Airline/components/SearchFlightMobile', () => ({
    default: () => <div data-testid="search-flight-mobile" />,
}));

vi.mock('@src/domains/dashboard/Hotels/Components/HotelSearch/Bookingfields', () => ({
    default: () => <div data-testid="booking-fields" />,
}));

vi.mock('@src/domains/dashboard/Hotels/Components/HotelSearch/BookingFieldsMobile', () => ({
    default: () => <div data-testid="booking-fields-mobile" />,
}));

vi.mock('../../../esim/components/home/Redirect', () => ({
    default: () => <div data-testid="esim-redirect" />,
}));

vi.mock('../../components/CorporateTravelCard', () => ({
    default: () => <div data-testid="corporate-travel-card-sm" />,
}));

vi.mock('../../components/SearchVisa', () => ({
    default: () => <div data-testid="search-visa">SearchVisa</div>,
}));

vi.mock('@src/slices/activeTabSlice', () => ({
    default: (state = {}) => state,
    updateActiveTab: vi.fn(payload => ({ type: 'activeTab/updateActiveTab', payload })),
}));

describe('CorporateTravel Page', () => {
    it('should render without crashing', () => {
        render(<CorporateTravel />);
        expect(screen.getByText(/modern way to manage corporate travel/i)).toBeInTheDocument();
    });

    it('should render the default flight search content for tab "1"', () => {
        render(<CorporateTravel />);
        expect(screen.getAllByTestId('search-flight').length).toBeGreaterThan(0);
    });
});

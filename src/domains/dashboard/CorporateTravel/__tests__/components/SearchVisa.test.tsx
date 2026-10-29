import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SearchVisa from '../../components/SearchVisa';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'user', id: 1 },
                visa: { searchParams: null, searchResults: [], isLoading: false },
            },
        }),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../../hooks/useVisaApi', () => ({
    useVisaCountries: () => ({ countries: [{ id: 103, name: 'India', code: 'IN' }], isLoading: false }),
    useVisaDestinations: () => ({
        destinations: [
            { destination: 'United Arab Emirates', country_id: 233, visa_types: ['evisa'], visa_categories: ['Tourist'] },
        ],
        isLoading: false,
    }),
    useVisaSearch: () => ({ search: vi.fn(), isLoading: false }),
}));

describe('SearchVisa Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<SearchVisa />);
        expect(screen.getByText('Search Visa')).toBeInTheDocument();
    });

    it('should render all field labels', () => {
        render(<SearchVisa />);
        expect(screen.getByText('Nationality')).toBeInTheDocument();
        expect(screen.getByText('Country of Residence')).toBeInTheDocument();
        expect(screen.getByText('Destination Country')).toBeInTheDocument();
        expect(screen.getByText('Travel Date')).toBeInTheDocument();
        expect(screen.getByText('Visa Type')).toBeInTheDocument();
    });

    it('should render the Search Visa button', () => {
        render(<SearchVisa />);
        expect(screen.getByRole('button', { name: /search visa/i })).toBeInTheDocument();
    });

    it('should render the Manage Booking button', () => {
        render(<SearchVisa />);
        expect(screen.getByRole('button', { name: /manage booking/i })).toBeInTheDocument();
    });

    it('should render the visa requirement heading', () => {
        render(<SearchVisa />);
        expect(screen.getByText(/enter your visa requirement details/i)).toBeInTheDocument();
    });
});

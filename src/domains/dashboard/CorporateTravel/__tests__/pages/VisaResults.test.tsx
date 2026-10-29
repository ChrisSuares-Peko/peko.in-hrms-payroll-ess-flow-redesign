import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VisaResults from '../../pages/VisaResults';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({
        state: {
            destination: 'United Arab Emirates',
            destinationId: 233,
            travelDate: '2025-06-01',
            nationality: 'India',
            visaType: 'Tourist',
        },
    }),
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: { corporateTravel: '/corporate-travel' },
        visa: { index: 'visa', travellerDetails: 'traveller-details' },
    },
}));

vi.mock('../../hooks/useVisaApi', () => ({
    useVisaSearch: () => ({
        visaOptions: [
            {
                id: '101',
                productId: 101,
                name: 'Dubai Tourist Visa 30 Days',
                days: 30,
                price: 970,
                pricePerPerson: 970,
                platformPayNow: 970,
                entryType: 'Single',
                processingTime: '3-5 days',
                visaType: 'evisa',
                serviceFee: 0,
                platformFee: 0,
                gst: 0,
                totalPayNow: 970,
                embassyFee: 0,
                visaInfo: '',
                requiredDocuments: [],
            },
        ],
        isLoading: false,
        selectProduct: vi.fn(),
    }),
}));

describe('VisaResults Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<VisaResults />);
        expect(screen.getByText(/available visas/i)).toBeInTheDocument();
    });

    it('should display the destination name', () => {
        render(<VisaResults />);
        expect(screen.getByText(/united arab emirates/i)).toBeInTheDocument();
    });

    it('should display visa card with product name', () => {
        render(<VisaResults />);
        expect(screen.getByText('Dubai Tourist Visa 30 Days')).toBeInTheDocument();
    });

    it('should display visa price', () => {
        render(<VisaResults />);
        expect(screen.getAllByText(/970/).length).toBeGreaterThan(0);
    });
});

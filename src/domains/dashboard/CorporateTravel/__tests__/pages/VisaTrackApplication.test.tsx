import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VisaTrackApplication from '../../pages/VisaTrackApplication';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: { orderNumber: 'VZA-2025-001' } }),
}));

vi.mock('../../hooks/useVisaApi', () => ({
    useTrackVisaApplication: () => ({
        applicantStatuses: [
            {
                id: 42,
                name: 'John Doe',
                status: { status_code: 'UNDER_REVIEW', terminal: 0, frontend_status: 'Under Review' },
            },
        ],
        applicationStatus: { status_code: 'UNDER_REVIEW', terminal: 0, frontend_status: 'Under Review' },
        isLoading: false,
        refetch: vi.fn(),
    }),
}));

vi.mock('@domains/dashboard/CorporateTravel/assets/icons/bankStatement.png', () => ({ default: 'bankStatement.png' }));
vi.mock('@domains/dashboard/CorporateTravel/assets/icons/passport.png', () => ({ default: 'passport.png' }));
vi.mock('@domains/dashboard/CorporateTravel/assets/icons/photograpgh.png', () => ({ default: 'photograph.png' }));

describe('VisaTrackApplication Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<VisaTrackApplication />);
        expect(screen.getByText(/track/i)).toBeInTheDocument();
    });

    it('should display the order number', () => {
        render(<VisaTrackApplication />);
        expect(screen.getAllByText('VZA-2025-001').length).toBeGreaterThan(0);
    });

    it('should display applicant count', () => {
        render(<VisaTrackApplication />);
        expect(screen.getByText('1 Traveller')).toBeInTheDocument();
    });
});

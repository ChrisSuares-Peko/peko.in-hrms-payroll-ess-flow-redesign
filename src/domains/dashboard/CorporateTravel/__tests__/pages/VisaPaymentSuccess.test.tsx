import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import VisaPaymentSuccess from '../../pages/VisaPaymentSuccess';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { orderNumber: 'VZA-2025-001' } }),
}));

vi.mock('@src/routes/paths', () => ({
    paths: {
        dashboard: { corporateTravel: '/corporate-travel', home: '/dashboard' },
        visa: { index: 'visa', visaTracking: 'track' },
    },
}));

describe('VisaPaymentSuccess Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render without crashing', () => {
        render(<VisaPaymentSuccess />);
        expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    });

    it('should display the order number from location state', () => {
        render(<VisaPaymentSuccess />);
        expect(screen.getByText('VZA-2025-001')).toBeInTheDocument();
    });

    it('should render the Track Application button', () => {
        render(<VisaPaymentSuccess />);
        expect(screen.getByRole('button', { name: /track application/i })).toBeInTheDocument();
    });

    it('should render the Go to Dashboard button', () => {
        render(<VisaPaymentSuccess />);
        expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('should navigate to dashboard when Go to Dashboard is clicked', () => {
        render(<VisaPaymentSuccess />);
        fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should show success message text', () => {
        render(<VisaPaymentSuccess />);
        expect(screen.getByText(/visa application has been submitted successfully/i)).toBeInTheDocument();
    });
});

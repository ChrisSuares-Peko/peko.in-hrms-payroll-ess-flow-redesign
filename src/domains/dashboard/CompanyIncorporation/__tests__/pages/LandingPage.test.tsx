import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useExistingApplication } from '../../hooks/useExistingApplication';
import LandingPage from '../../pages/LandingPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (cb: (s: any) => any) => cb({ reducer: { auth: { id: 7, role: 'corporate' } } }),
}));

vi.mock('@routes/paths', () => ({
    paths: {
        companyIncorporation: {
            index: '/company-incorporation',
            form: '/company-incorporation/form',
            payment: 'payment',
            tracking: '/company-incorporation/tracking',
        },
    },
}));

vi.mock('../../api', () => ({
    getApplicationDetail: vi.fn(),
}));

vi.mock('../../hooks/useExistingApplication', () => ({
    useExistingApplication: vi.fn(),
}));

const mockHook = useExistingApplication as Mock;

describe('LandingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the marketing/normal view when there is no existing application', () => {
        mockHook.mockReturnValue({ existingApplication: null, isLoading: false });
        render(<LandingPage />);
        expect(screen.getByText('Start Company Incorporation')).toBeInTheDocument();
        expect(screen.getByText('What you will need ?')).toBeInTheDocument();
    });

    it('navigates to the form when "Start Company Incorporation" is clicked', () => {
        mockHook.mockReturnValue({ existingApplication: null, isLoading: false });
        render(<LandingPage />);
        fireEvent.click(screen.getByText('Start Company Incorporation'));
        expect(mockNavigate).toHaveBeenCalledWith('/company-incorporation/form');
    });

    it('shows the submitted view with payment CTA for a PENDING application', () => {
        mockHook.mockReturnValue({
            existingApplication: {
                applicationId: 'INC/2026/00001',
                status: 'PENDING',
                createdAt: '2026-03-01T00:00:00Z',
                totalAmount: 30000,
            },
            isLoading: false,
        });
        render(<LandingPage />);
        expect(screen.getByText('INC/2026/00001')).toBeInTheDocument();
        expect(screen.getByText('View Application')).toBeInTheDocument();
        expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    });

    it('does not render the normal view while loading', () => {
        mockHook.mockReturnValue({ existingApplication: null, isLoading: true });
        render(<LandingPage />);
        expect(screen.queryByText('Start Company Incorporation')).toBeNull();
    });
});

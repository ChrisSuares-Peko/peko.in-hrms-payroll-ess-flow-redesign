import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import TrackingPage from '../../pages/TrackingPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@hooks/useUserInfo', () => ({
    default: () => ({ getUserData: vi.fn() }),
}));

vi.mock('../../hooks/useApplicationTracking', () => ({
    useApplicationTracking: () => ({ fetchApplications: vi.fn() }),
}));

vi.mock('@routes/paths', () => ({
    paths: {
        companyIncorporation: { index: '/company-incorporation' },
        dashboard: { home: '/dashboard' },
    },
}));

const mockIncorporation = (incorporation: any) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({ reducer: { incorporation } })
    );
};

describe('TrackingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a spinner while loading', () => {
        mockIncorporation({ applications: [], currentApplicationDetail: null, isLoading: true });
        const { container } = render(<TrackingPage />);
        expect(container.querySelector('.ant-spin')).toBeTruthy();
    });

    it('renders the tracker card for an active (non-pending) application', () => {
        mockIncorporation({
            applications: [],
            isLoading: false,
            currentApplicationDetail: {
                applicationId: 'INC/2026/00001',
                status: 'SUBMITTED',
                createdAt: '2026-03-01T00:00:00Z',
                vendorStages: [],
            },
        });
        render(<TrackingPage />);
        expect(screen.getByText('Application ID: INC/2026/00001')).toBeInTheDocument();
        expect(screen.getByText('Back to dashboard')).toBeInTheDocument();
    });

    it('shows an empty state when there are no applications', () => {
        mockIncorporation({ applications: [], currentApplicationDetail: null, isLoading: false });
        render(<TrackingPage />);
        expect(screen.getByText('No applications found')).toBeInTheDocument();
    });
});

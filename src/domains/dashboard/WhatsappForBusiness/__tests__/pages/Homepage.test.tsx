import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { useCreateBusinessProfileApi } from '../../hooks/useCreateBusinessProfile';
import HomePage from '../../pages/HomePage';

const mockDispatch = vi.fn();

vi.mock('../../hooks/useCreateBusinessProfile', () => ({
    useCreateBusinessProfileApi: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    __esModule: true,
    default: vi.fn(() => ({ xs: false })), // Ensure it always returns an object
}));

vi.mock('../../components/subscription/AdaptiveSubscription', () => ({
    __esModule: true,
    default: vi.fn(({ children }) => <div data-testid="adaptive-subscription">{children}</div>),
}));

vi.mock('../../pages/LandingPage', () => ({
    __esModule: true,
    default: vi.fn(() => <div data-testid="landing-page">Landing Page</div>),
}));

vi.mock('../../components/subscription/WebSubscription', () => ({
    __esModule: true,
    default: vi.fn(({ children }) => <div data-testid="web-subscription">{children}</div>),
}));

describe('HomePage', () => {
    const mockBusinessProfile = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
        (useCreateBusinessProfileApi as Mock).mockReturnValue({
            BusinessProfile: mockBusinessProfile,
        });
    });

    it('renders Skeleton while loading', () => {
        (useCreateBusinessProfileApi as Mock).mockReturnValue({
            BusinessProfile: () => {}, // Does nothing
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('calls BusinessProfile API and updates state', async () => {
        mockBusinessProfile.mockImplementation(setIsPurchased => {
            setIsPurchased(false);
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockBusinessProfile).toHaveBeenCalled();
        });
    });

    it('renders LandingPage when isPurchased is true', async () => {
        mockBusinessProfile.mockImplementation(setIsPurchased => {
            setIsPurchased(true);
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );
        await waitFor(() => {
            screen.debug(undefined, 4000000);
            expect(screen.getByTestId('landing-page')).toBeInTheDocument();
        });
    });

    it('renders AdaptiveSubscription on small screens when isPurchased is false', async () => {
        (useScreenSize as any).mockReturnValue({ xs: true });

        mockBusinessProfile.mockImplementation(setIsPurchased => {
            setIsPurchased(false);
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('adaptive-subscription')).toBeInTheDocument();
        });
    });

    it('renders WebSubscription on larger screens when isPurchased is false', async () => {
        (useScreenSize as Mock).mockReturnValue({ xs: false });

        mockBusinessProfile.mockImplementation(setIsPurchased => {
            setIsPurchased(false);
        });

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('web-subscription')).toBeInTheDocument();
        });
    });
});

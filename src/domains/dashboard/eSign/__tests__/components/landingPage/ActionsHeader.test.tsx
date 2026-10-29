import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import ActionsHeader from '../../../components/landingPage/ActionsHeader';
import useGetESignCount from '../../../hooks/useGetESignCount';

// Mock useNavigate separately
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock hooks properly
vi.mock('@src/hooks/useScreenSize', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('../../../hooks/useGetESignCount', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    __esModule: true,
    default: vi.fn(),
}));

// Mock Redux store
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        user: { id: 1, name: 'Test User' }, // ADDING A MOCK USER OBJECT
    },
});

describe('ActionsHeader Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useScreenSize as any).mockReturnValue({ md: true });
        (useGetESignCount as any).mockReturnValue({
            count: 10,
            pendingCount: 5,
            completedCount: 20,
            isLoading: false,
        });
        (useGetAddonDetails as any).mockReturnValue({
            addonData: { maxLimit: 100 },
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ActionsHeader />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('eSign')).toBeInTheDocument();
        expect(screen.getByText('Experience the Power of eSign')).toBeInTheDocument();

        // Fix for multiple matching elements
        expect(screen.getAllByText('Documents sent for signing').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Awaiting Signatures').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Documents Signed').length).toBeGreaterThan(0);
    });

    it('displays correct eSign counts', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ActionsHeader />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('10')).toBeInTheDocument(); // Documents sent for signing
        expect(screen.getByText('5')).toBeInTheDocument(); // Awaiting Signatures
        expect(screen.getByText('20')).toBeInTheDocument(); // Documents Signed
    });

    it('renders the eSign introduction section correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ActionsHeader />
                </MemoryRouter>
            </Provider>
        );

        // Check if the heading text is present
        expect(screen.getByText('Experience the Power of eSign')).toBeInTheDocument();

        // Ensure that the descriptive paragraph is rendered
        expect(
            screen.getByText(
                /The #1 way to digitally sign documents that are legally valid in India/i
            )
        ).toBeInTheDocument();
    });
});

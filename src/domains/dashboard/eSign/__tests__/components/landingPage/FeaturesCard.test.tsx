import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import FeaturesCard from '../../../components/landingPage/FeaturesCard';

// Mock hooks and functions
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

const mockStore = configureStore();
const store = mockStore({});

describe('FeaturesCard Component', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });

    const mockProps = {
        icon: '/test-icon.svg',
        title: 'Test Feature',
        path: '/test-path',
        eSignLeft: 5,
        accessLimit: false,
    };

    it('renders the feature card correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <FeaturesCard {...mockProps} />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Test Feature')).toBeInTheDocument();
    });

    it('navigates to the correct path when clicked', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <FeaturesCard {...mockProps} />
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByText('Test Feature'));
        expect(mockNavigate).toHaveBeenCalledWith('/test-path');
    });

    it('dispatches a warning toast when eSign limit is exceeded', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <FeaturesCard {...mockProps} eSignLeft={0} accessLimit />
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByText('Test Feature'));
        expect(showToast).toHaveBeenCalledWith({
            description: 'You have reached your eSign limit. Please upgrade to continue.',
            variant: 'warning',
        });
    });

    it('renders the icon correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <FeaturesCard {...mockProps} />
                </MemoryRouter>
            </Provider>
        );

        const iconElement = document.querySelector(`[data-src="${mockProps.icon}"]`);
        expect(iconElement).not.toBeNull();
    });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import ESignHeader from '../../../components/landingPage/ESignHeader';

// Mock hooks and functions
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@src/hooks/useScreenSize', () => ({
    __esModule: true,
    default: () => ({ md: true }),
}));

const mockStore = configureStore();
const store = mockStore({});

describe('ESignHeader Component', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });

    it('renders the heading and description correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignHeader />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Signing made simple and secure')).toBeInTheDocument();
        expect(
            screen.getByText(
                /Use our service to e-sign invoices, offer letters, agreements, and other/i
            )
        ).toBeInTheDocument();
    });

    it('renders the "Sign a Document" and "eSign Status" buttons', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignHeader />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole('button', { name: /Sign a Document/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /eSign Status/i })).toBeInTheDocument();
    });

    it('navigates to the correct paths when buttons are clicked', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignHeader />
                </MemoryRouter>
            </Provider>
        );

        // Click "Sign a Document"
        fireEvent.click(screen.getByRole('button', { name: /Sign a Document/i }));
        expect(mockNavigate).toHaveBeenCalledWith(paths.eSign.uploadPage);

        // Click "eSign Status"
        fireEvent.click(screen.getByRole('button', { name: /eSign Status/i }));
        expect(mockNavigate).toHaveBeenCalledWith(paths.eSign.historyPage);
    });

    it('renders the landing page image correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignHeader />
                </MemoryRouter>
            </Provider>
        );

        const image = screen.getByRole('img');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/src/domains/dashboard/eSign/assets/landing.png');
    });
});

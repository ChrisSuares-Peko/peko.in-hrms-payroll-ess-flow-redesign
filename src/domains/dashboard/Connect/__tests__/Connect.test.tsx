import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useConnectApi } from '../hooks/useConnectApi';
import Connect from '../pages/Connect';

vi.mock('../hooks/useConnectApi', () => ({
    useConnectApi: vi.fn(),
}));

const mockStore = configureStore();
const store = mockStore({});

describe('Connect Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        (useConnectApi as any).mockReturnValue({
            data: [
                {
                    id: 1,
                    name: 'Provider A',
                    tagline: 'Best Service',
                    image: 'img1.jpg',
                    offer: '20% Off',
                },
                {
                    id: 2,
                    name: 'Provider B',
                    tagline: 'Quality Service',
                    image: 'img2.jpg',
                    offer: '30% Off',
                },
            ],
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Connect />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Provider A')).toBeInTheDocument();
        expect(screen.getByText('Provider B')).toBeInTheDocument();
    });

    it('filters providers based on search input', async () => {
        (useConnectApi as any).mockReturnValue({
            data: [
                {
                    id: 1,
                    name: 'Provider A',
                    tagline: 'Best Service',
                    image: 'img1.jpg',
                    offer: '20% Off',
                },
                {
                    id: 2,
                    name: 'Provider B',
                    tagline: 'Quality Service',
                    image: 'img2.jpg',
                    offer: '30% Off',
                },
            ],
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Connect />
                </MemoryRouter>
            </Provider>
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Provider A' } });

        await waitFor(() => {
            expect(screen.getByText('Provider A')).toBeInTheDocument();
            expect(screen.queryByText('Provider B')).not.toBeInTheDocument();
        });
    });

    it('shows "No result found" when no data matches the search', async () => {
        (useConnectApi as any).mockReturnValue({
            data: [
                {
                    id: 1,
                    name: 'Provider A',
                    tagline: 'Best Service',
                    image: 'img1.jpg',
                    offer: '20% Off',
                },
            ],
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Connect />
                </MemoryRouter>
            </Provider>
        );

        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'Non-existent Provider' } });

        await waitFor(() => {
            expect(screen.getByText('No result found')).toBeInTheDocument();
        });
    });
});

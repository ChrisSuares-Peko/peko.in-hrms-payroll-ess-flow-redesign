import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import OfficeAddressLarge from '../components/OfficeAddressLarge';
import usePlansApi from '../hooks/usePlansApi';

vi.mock('../hooks/usePlansApi');

const mockStore = configureStore();
const store = mockStore({});

describe('OfficeAddressLarge Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading skeleton when loading', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: null, isLoading: true });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OfficeAddressLarge />
                </MemoryRouter>
            </Provider>
        );
        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('renders office address title and order history button', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OfficeAddressLarge />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Office Address')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /order history/i })).toBeInTheDocument();
    });

    it('renders available plans', () => {
        const mockPlans = {
            data: [
                { id: 1, name: 'Plan A' },
                { id: 2, name: 'Plan B' },
            ],
        };

        (usePlansApi as unknown as any).mockReturnValue({ plans: mockPlans, isLoading: false });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OfficeAddressLarge />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('Plan A')).toBeInTheDocument();
        expect(screen.getByText('Plan B')).toBeInTheDocument();
    });

    it('shows empty state when no plans are available', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OfficeAddressLarge />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('No plans available at the moment')).toBeInTheDocument();
    });

    it('renders the icon cards correctly', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <OfficeAddressLarge />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('How Office Address Works?')).toBeInTheDocument();
    });
});

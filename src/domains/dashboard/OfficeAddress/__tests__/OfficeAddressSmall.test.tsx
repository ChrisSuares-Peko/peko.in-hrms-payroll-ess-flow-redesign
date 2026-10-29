import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import OfficeAddressSmall from '../components/OfficeAddressSmall';
import usePlansApi from '../hooks/usePlansApi';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    Link: ({ children }: any) => children,
}));

vi.mock('../hooks/usePlansApi');

const mockStore = configureStore();
const store = mockStore({});

describe('OfficeAddressSmall Component', () => {
    const mockNavigate = vi.fn();
    (useNavigate as unknown as any).mockReturnValue(mockNavigate);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading skeleton when loading', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: null, isLoading: true });

        render(
            <Provider store={store}>
                <OfficeAddressSmall />
            </Provider>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('renders office address title and order history button', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <OfficeAddressSmall />
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
                <OfficeAddressSmall />
            </Provider>
        );

        expect(screen.getByText('Plan A')).toBeInTheDocument();
        expect(screen.getByText('Plan B')).toBeInTheDocument();
    });

    it('shows empty state when no plans are available', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <OfficeAddressSmall />
            </Provider>
        );

        expect(screen.getByText('No plans available at the moment')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('navigates to dashboard when Go to Dashboard button is clicked', () => {
        (usePlansApi as unknown as any).mockReturnValue({ plans: { data: [] }, isLoading: false });

        render(
            <Provider store={store}>
                <OfficeAddressSmall />
            </Provider>
        );

        const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
        fireEvent.click(dashboardButton);

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.home);
    });
});

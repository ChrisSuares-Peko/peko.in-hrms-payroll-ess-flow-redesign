import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useGetDetailsSubscription } from '../../hooks/useGetDetailsSubscription';
import useWhatsAppSubscriptionPayment from '../../hooks/useSubscriptionPayment';
import PlanDetails from '../../pages/PlanDetails';

vi.mock('../../hooks/useGetDetailsSubscription', () => ({
    useGetDetailsSubscription: vi.fn(),
}));

vi.mock('../../hooks/useSubscriptionPayment', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleSubmission: vi.fn(),
    })),
}));

const mockStore = configureStore([]);

describe('PlanDetails Component', () => {
    let store: any;
    let handleSubmissionMock: Mock;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { id: 1 },
            },
        });

        handleSubmissionMock = vi.fn();

        (useWhatsAppSubscriptionPayment as Mock).mockReturnValue({
            handleSubmission: handleSubmissionMock,
        });

        (useGetDetailsSubscription as Mock).mockReturnValue({
            packages: [
                {
                    id: 1,
                    packageName: 'WhatsApp Basic',
                    packagePrices: { monthly: 49, annually: 499 },
                    discount: { monthly: 39, annually: 399 },
                },
                {
                    id: 2,
                    packageName: 'Pro',
                    packagePrices: { monthly: 99, annually: 999 },
                    discount: { monthly: 79, annually: 799 },
                },
            ],
        });
    });

    it('renders correctly with the initial state', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <PlanDetails />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/Choose the perfect plan for your business/i)).toBeInTheDocument();
        expect(screen.getByText('Basic')).toBeInTheDocument();
        expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('updates the selected duration when SwitchPlan is toggled', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <PlanDetails />
                </MemoryRouter>
            </Provider>
        );

        const switchPlanButton = screen.getByText(/Annually/i);

        fireEvent.click(switchPlanButton);

        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('calls handlePurchasePlan when purchasing a plan', async () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <PlanDetails />
                </MemoryRouter>
            </Provider>
        );

        const purchaseButton = screen.getAllByRole('button', { name: /Purchase/i })[0];

        fireEvent.click(purchaseButton);

        await waitFor(() => {
            expect(handleSubmissionMock).toHaveBeenCalledTimes(1);
        });
    });

    it('displays the correct discounted amount based on selected plan duration', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <PlanDetails />
                </MemoryRouter>
            </Provider>
        );
        screen.debug(undefined, 999999);

        expect(screen.getByText('10')).toBeInTheDocument(); // Monthly discount for Basic
        expect(screen.getByText('20')).toBeInTheDocument(); // Monthly discount for Premium
    });
});

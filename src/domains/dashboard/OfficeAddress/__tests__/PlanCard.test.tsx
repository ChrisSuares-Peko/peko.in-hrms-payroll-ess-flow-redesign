import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanCard from '../components/PlanCard';
import { PlanDetail } from '../types';

const mockStore = configureStore();
const store = mockStore({});

describe('PlanCard Component', () => {
    const mockPlan: PlanDetail = {
        id: 101,
        name: 'Premium Plan',
        highlights: 'Unlimited calls, Free streaming, Ad-free experience',
        price: '1200',
        description: 'A premium plan with exclusive features',
        billingCycle: 'YEARLY',
        logo: '',
        is_available: false,
        status: false,
    };

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <PlanCard plan={mockPlan} />
            </Provider>
        );

        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('A premium plan with exclusive features')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,200')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
    });

    it('correctly formats and displays the yearly cost when billing is monthly', () => {
        render(
            <Provider store={store}>
                <PlanCard plan={{ ...mockPlan, billingCycle: 'MONTHLY', price: '100' }} />
            </Provider>
        );

        expect(screen.getByText('₹ 100')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(
            screen.getByText(`Yearly cost you ₹ ${formatNumberWithLocalString(100 * 12)}`)
        ).toBeInTheDocument();
    });

    it('correctly formats and displays the monthly cost when billing is yearly', () => {
        render(
            <Provider store={store}>
                <PlanCard plan={{ ...mockPlan, billingCycle: 'YEARLY', price: '1200' }} />
            </Provider>
        );

        expect(screen.getByText('₹ 1,200')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
        expect(
            screen.getByText(`Monthly cost you ₹ ${formatNumberWithLocalString(1200 / 12)}`)
        ).toBeInTheDocument();
    });

    it('renders the highlights text properly', () => {
        render(
            <Provider store={store}>
                <PlanCard plan={mockPlan} />
            </Provider>
        );

        expect(
            screen.getByText('Unlimited calls, Free streaming, Ad-free experience')
        ).toBeInTheDocument();
    });
});

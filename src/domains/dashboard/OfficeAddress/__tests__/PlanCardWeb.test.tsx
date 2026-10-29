import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import PlanCardWeb from '../components/PlanCardWeb';
import { PlanDetail } from '../types';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

const mockStore = configureStore();
const store = mockStore({});

describe('PlanCardWeb Component', () => {
    const mockNavigate = vi.fn();
    (useNavigate as unknown as any).mockReturnValue(mockNavigate);

    const mockPlan: PlanDetail = {
        id: 123,
        name: 'Premium Plan',
        highlights: 'Unlimited data, Free streaming, No ads',
        price: '1200',
        description: 'A premium plan with many benefits',
        billingCycle: 'YEARLY',
        is_available: true,
        logo: '',
        status: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <PlanCardWeb plan={mockPlan} />
            </Provider>
        );

        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('A premium plan with many benefits')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,200')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /purchase/i })).toBeInTheDocument();
    });

    it('calculates and displays yearly cost correctly', () => {
        render(
            <Provider store={store}>
                <PlanCardWeb plan={{ ...mockPlan, billingCycle: 'MONTHLY', price: '100' }} />
            </Provider>
        );

        expect(screen.getByText('₹ 100')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(screen.getByText('Yearly cost you ₹ 1,200.00')).toBeInTheDocument();
    });

    it('calculates and displays monthly cost correctly for yearly plans', () => {
        render(
            <Provider store={store}>
                <PlanCardWeb plan={{ ...mockPlan, billingCycle: 'YEARLY', price: '1200' }} />
            </Provider>
        );

        expect(screen.getByText('₹ 1,200')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
        expect(screen.getByText('Monthly cost you ₹ 100.00')).toBeInTheDocument();
    });

    it('navigates to the correct plan when "Purchase" button is clicked', () => {
        render(
            <Provider store={store}>
                <PlanCardWeb plan={mockPlan} />
            </Provider>
        );

        const purchaseButton = screen.getByRole('button', { name: /purchase/i });
        fireEvent.click(purchaseButton);

        expect(mockNavigate).toHaveBeenCalledWith('premium', { state: 123 });
    });

    it('shows toast message when plan is unavailable', () => {
        render(
            <Provider store={store}>
                <PlanCardWeb plan={{ ...mockPlan, is_available: false }} />
            </Provider>
        );

        const purchaseButton = screen.getByRole('button', { name: /purchase/i });
        fireEvent.click(purchaseButton);

        expect(mockDispatch).toHaveBeenCalledWith(
            showToast({
                description:
                    "Workspace currently unavailable. We'll notify you when it's accessible. Thank you.",
                variant: 'error',
            })
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import PaymentFailurePage from '../../pages/PaymentFailurePage';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

vi.mock('../../../payments/slices/payment', () => ({
    resetPaymentData: vi.fn(() => ({ type: 'payment/resetPaymentData' })),
}));

describe('PaymentFailurePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders the failure message', () => {
        render(<PaymentFailurePage />);

        expect(screen.getByText('Your transaction has failed')).toBeInTheDocument();
        expect(
            screen.getByText(/refund will be processed within 7 working days/i)
        ).toBeInTheDocument();
    });

    test('navigates to the verification suite settings page when Try Again is clicked', () => {
        render(<PaymentFailurePage />);

        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

        expect(mockNavigate).toHaveBeenCalledWith('/verification-suite/settings');
    });

    test('resets payment data on unmount', () => {
        const { unmount } = render(<PaymentFailurePage />);

        expect(mockDispatch).not.toHaveBeenCalled();

        unmount();

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'payment/resetPaymentData' });
    });
});

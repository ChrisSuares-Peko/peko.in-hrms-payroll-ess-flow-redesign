import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import PaymentSuccessPage from '../../pages/PaymentSuccessPage';

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

vi.mock('react-lottie', () => ({
    __esModule: true,
    default: () => <div data-testid="lottie-mock" />,
}));

describe('PaymentSuccessPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders the success message', () => {
        render(<PaymentSuccessPage />);

        expect(screen.getByText('Add-on Purchased Successfully')).toBeInTheDocument();
        expect(
            screen.getByText('Additional verifications are now available on your account.')
        ).toBeInTheDocument();
        expect(screen.getByTestId('lottie-mock')).toBeInTheDocument();
    });

    test('navigates to the verification suite home page when clicking the button', () => {
        render(<PaymentSuccessPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Go to Verification Suite' }));

        expect(mockNavigate).toHaveBeenCalledWith('/verification-suite');
    });

    test('resets payment data on unmount', () => {
        const { unmount } = render(<PaymentSuccessPage />);

        expect(mockDispatch).not.toHaveBeenCalled();

        unmount();

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'payment/resetPaymentData' });
    });
});

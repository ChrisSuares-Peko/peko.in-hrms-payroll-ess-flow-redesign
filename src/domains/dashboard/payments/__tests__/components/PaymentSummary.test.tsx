import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import PaymentSummary from '../../components/PaymentSummary';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));
const mockhandleWalletpayment = vi.fn();
const mockhandlePaytmPaymentRequest = vi.fn();
const mockhandleCardPaymentRequest = vi.fn();
const mockLoadCheckoutScript = vi.fn();

vi.mock('../../hooks/usePaymentApi', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleCardPaymentRequest: mockhandleCardPaymentRequest,
        handlePaytmPaymentRequest: mockhandlePaytmPaymentRequest,
        handleWalletPaymentRequest: mockhandleWalletpayment,
        isLoading: false,
        isSpinnerLoading: false,
        loadCheckoutScript: mockLoadCheckoutScript,
    })),
}));

vi.mock('../../hooks/useWalletApi', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        walletData: {
            balance: 500000,
            currency: 'INR',
        },
    })),
}));

describe('PaymentSummary Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    user: { user: { roleName: 'user' } },
                    auth: { role: 'admin', id: 123 },
                    payment: {
                        billSummary: [{ key: 'Total', value: '1000' }],
                        paymentSummary: [{ key: 'Tax', value: '100' }],
                        totalAmount: 1000,
                        minimumAmount: 10,
                        maximumAmount: 5000,
                        earningCashbackAmount: 50,
                        payload: { accessKey: 'test-key' },
                    },
                },
            })
        );
    });
    test('renders correctly with valid bill summary', () => {
        render(<PaymentSummary />);
        expect(screen.getByText('Bill Summary')).toBeInTheDocument();
        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.getByText('Total Payment Summary')).toBeInTheDocument();
    });

    test('navigates away when bill summary is empty', () => {
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    user: { user: { roleName: 'user' } },
                    auth: { role: 'admin', id: 123 },
                    payment: {
                        billSummary: [], // Empty bill summary
                        paymentSummary: [],
                        totalAmount: 0,
                    },
                },
            })
        );

        render(<PaymentSummary />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('disables "Pay" button when no payment method is selected', () => {
        render(<PaymentSummary />);
        screen.debug(undefined, 4039483948);

        const payButton = screen.getByRole('button', { name: /Pay/i });
        expect(payButton).toBeDisabled();
    });

    test('calls the correct payment function on button click', async () => {
        render(<PaymentSummary />);

        // Ensure loadCheckoutScript is called inside useEffect
        await waitFor(() => {
            expect(mockLoadCheckoutScript).toHaveBeenCalled();
        });

        screen.debug(undefined, 7788787878); // 👈 Debugging: Check if elements exist

        // Find and click the card payment option
        const cardPaymentOption = await screen.findByText(
            /BHIM\/UPI\/Credit Card\/Debit Card\/Bank Account/i
        );
        fireEvent.click(cardPaymentOption);

        // Wait for the pay button to be enabled
        const payButton = await screen.findByRole('button', { name: /Pay/i });

        await waitFor(() => expect(payButton).not.toBeDisabled(), { timeout: 5000 });

        fireEvent.click(payButton);

        await waitFor(() => {
            expect(mockhandlePaytmPaymentRequest).toHaveBeenCalled();
        });
    });
});

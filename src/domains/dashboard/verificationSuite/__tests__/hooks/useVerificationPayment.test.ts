import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setPaymentData } from '../../../payments/slices/payment';
import { getAddonPricing } from '../../../plans/api';
import useVerificationPayment from '../../hooks/useVerificationPayment';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: any) =>
        selector({ reducer: { auth: { id: 7, role: 'corporate' } } }),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../../payments/slices/payment', () => ({
    setPaymentData: vi.fn((payload: any) => ({ type: 'payment/setPaymentData', payload })),
}));

vi.mock('../../../plans/api', () => ({
    getAddonPricing: vi.fn(),
}));

describe('useVerificationPayment Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('prices the add-on with GST, dispatches the payment payload and opens the review order page', async () => {
        vi.mocked(getAddonPricing).mockResolvedValue({
            taxableAmount: 150,
            taxAmount: 27,
            taxRate: 18,
            expectedPaymentAmount: 177,
            unitPrice: 15,
            quantity: 10,
        });
        const { result } = renderHook(() => useVerificationPayment(10));

        await act(async () => {
            await result.current.handleSubmission();
        });

        expect(getAddonPricing).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            addonsAccessKey: 'verification_suite',
            quantity: 10,
        });
        expect(setPaymentData).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Verification Suite',
                totalAmount: 177,
                paymentSummary: [{ key: 'GST (18%)', value: '₹ 27.00' }],
                payload: expect.objectContaining({
                    accessKey: 'verification_suite',
                    quantity: 10,
                    amount: 150,
                }),
            })
        );
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/verification-suite/review-order');
        expect(result.current.loading).toBe(false);
    });

    it('shows an error and stays on the page when the price cannot be fetched', async () => {
        vi.mocked(getAddonPricing).mockResolvedValue(false);
        const { result } = renderHook(() => useVerificationPayment(10));

        await act(async () => {
            await result.current.handleSubmission();
        });

        expect(setPaymentData).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
        expect(result.current.loading).toBe(false);
    });
});

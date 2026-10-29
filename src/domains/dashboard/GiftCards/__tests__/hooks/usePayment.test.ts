import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';

import usePayment from '../../hooks/usePayment';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/payment', () => ({
    setPaymentData: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

describe('usePayment Hook', () => {
    let mockDispatch: Mock;
    let mockNavigate: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockDispatch = vi.fn();
        mockNavigate = vi.fn();

        (useNavigate as Mock).mockReturnValue(mockNavigate);
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (getSurcharge as Mock).mockResolvedValue({ surcharge: '10.00', corporateCashback: '5.00' });
        (useAppSelector as Mock).mockImplementation(callback =>
            callback({
                reducer: {
                    auth: { role: 'admin', id: '123' },
                    giftcardCheckout: {
                        productDetails: { id: 'giftcard-123', product_name: 'Amazon Gift Card', accessKey: 'gift-card' },
                        formDetails: { product: '1000', quantity: '2' },
                    },
                },
            })
        );
    });

    it('should return handleSubmission function', () => {
        const { result } = renderHook(() => usePayment());
        expect(typeof result.current.handleSubmission).toBe('function');
    });

    it('should dispatch setPaymentData with correct values', async () => {
        const { result } = renderHook(() => usePayment());

        const mockValues = {
            receiverFirstName: 'John',
            receiverEmail: 'john@example.com',
            message: 'Happy Birthday!',
            senderName: 'Alice',
        };

        await act(async () => {
            await result.current.handleSubmission(mockValues);
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            payload: {
                billSummary: [
                    { key: 'Service name', value: 'Gift Cards' },
                    { key: 'Gift card name', value: 'Amazon Gift Card' },
                    { key: 'Quantity', value: '2' },
                    { key: 'Amount', value: '1,000.00' },
                ],
                paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 10.00' }],
                totalAmount: 1010,
                title: 'Bill Summary',
                payload: {
                    giftCardId: 'giftcard-123',
                    first_name: 'John',
                    email: 'john@example.com',
                    number_of_items: '2',
                    amount: '1000',
                    senderName: 'Alice',
                    message: 'Happy Birthday!',
                    accessKey: 'gift-card',
                },
                url: 'purchase/giftcards/payment',
                earningCashbackAmount: 5,
            },
            type: 'payment/setPaymentData',
        });
    });

    it('should navigate to payments page after submission', async () => {
        const { result } = renderHook(() => usePayment());

        await act(async () => {
            await result.current.handleSubmission({
                receiverFirstName: 'John',
                receiverEmail: 'john@example.com',
                message: 'Happy Birthday!',
                senderName: 'Alice',
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });
});

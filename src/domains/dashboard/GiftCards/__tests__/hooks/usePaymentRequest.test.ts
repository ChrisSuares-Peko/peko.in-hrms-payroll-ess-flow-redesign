import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { makePayment } from '../../api/index';
import usePaymentRequest from '../../hooks/usePaymentRequest';
import { PaymentPayload } from '../../types/types';

// 🛠️ Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api/index', () => ({
    makePayment: vi.fn(),
}));

describe('usePaymentRequest Hook', () => {
    const mockPayload: PaymentPayload = {
        amount: 1000,
        cardId: 'card-456',
        receiverFirstName: 'John',
        receiverLastName: 'Doe',
        receiverEmail: 'john.doe@example.com',
        senderName: 'Alice',
        message: 'Happy Birthday!',
        employee: [],
        receiverMobile: '',
        gender: '',
        quantity: 0,
        totalAmount: 0,
        postcode: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should call makePayment with correct parameters and return true on success', async () => {
        (makePayment as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => usePaymentRequest());

        let response;
        await act(async () => {
            response = await result.current.handlePaymentRequest(mockPayload);
        });

        expect(makePayment).toHaveBeenCalledWith({
            ...mockPayload,
            credentialId: '123',
            userType: 'admin',
        });
        expect(response).toBe(true);
    });

    it('should return false if the payment request fails', async () => {
        (makePayment as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentRequest());

        let response;
        await act(async () => {
            response = await result.current.handlePaymentRequest(mockPayload);
        });

        expect(makePayment).toHaveBeenCalledWith({
            ...mockPayload,
            credentialId: '123',
            userType: 'admin',
        });
        expect(response).toBe(false);
    });
});

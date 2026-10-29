import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import useCodeIssueApi from '../../hooks/useCodeIssueApi';
import useHandlePayment from '../../hooks/useHandlePayment';
import usePaymentRequest from '../../hooks/usePaymentRequest';

vi.mock('../../hooks/usePaymentRequest', () => ({
    default: vi.fn(),
}));

vi.mock('../../hooks/useCodeIssueApi', () => ({
    default: vi.fn(),
}));

describe('useHandlePayment Hook', () => {
    let mockHandlePaymentRequest: Mock;
    let mockGetCodeData: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockHandlePaymentRequest = vi.fn();
        mockGetCodeData = vi.fn();

        (usePaymentRequest as Mock).mockReturnValue({
            handlePaymentRequest: mockHandlePaymentRequest,
        });

        (useCodeIssueApi as Mock).mockReturnValue(mockGetCodeData);
    });

    it('should update paymentSuccessful when payment is successful', async () => {
        mockHandlePaymentRequest.mockResolvedValue(true);

        const { result } = renderHook(() => useHandlePayment());

        await act(async () => {
            await result.current.handleSubmit({ id: 'giftcard-123', amount: 1000 });
        });

        expect(result.current.paymentSuccessful).toBe(true);
        expect(mockHandlePaymentRequest).toHaveBeenCalledWith({ id: 'giftcard-123', amount: 1000 });
    });

    it('should call getCodeData after successful payment with a delay', async () => {
        vi.useFakeTimers();
        mockHandlePaymentRequest.mockResolvedValue(true);

        const { result } = renderHook(() => useHandlePayment());

        await act(async () => {
            await result.current.handleSubmit({ id: 'giftcard-123', amount: 1000 });
        });

        expect(result.current.paymentSuccessful).toBe(true);

        // Fast-forward time by 10 seconds
        await act(async () => {
            vi.advanceTimersByTime(10000);
        });

        expect(mockGetCodeData).toHaveBeenCalledWith('giftcard-123');
        vi.useRealTimers();
    });

    it('should not call getCodeData if payment fails', async () => {
        mockHandlePaymentRequest.mockResolvedValue(false);

        const { result } = renderHook(() => useHandlePayment());

        await act(async () => {
            await result.current.handleSubmit({ id: 'giftcard-123', amount: 1000 });
        });

        expect(result.current.paymentSuccessful).toBe(false);
        expect(mockGetCodeData).not.toHaveBeenCalled();
    });
});

import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { setPaymentData } from '@src/slices/payment';

import { PaymentState } from '../../../payments/slices/payment';
import GetSurcharge from '../../hooks/useSurchargeApi';
import useWccPayment from '../../hooks/useWccPayment';
import { resetWhatsappBusinessState } from '../../slices/paymentSlice';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(() => ({ getSurchargeData: vi.fn() })),
}));

describe('useWccPayment', () => {
    const navigate = vi.fn();
    const dispatch = vi.fn();
    const getSurchargeData = vi.fn();

    beforeEach(() => {
        (useNavigate as Mock).mockReturnValue(navigate);
        (useAppDispatch as Mock).mockReturnValue(dispatch);
        (GetSurcharge as Mock).mockReturnValue({ getSurchargeData });

        vi.clearAllMocks();
    });

    it('should call getSurchargeData with the correct amount', async () => {
        getSurchargeData.mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        const { result } = renderHook(() => useWccPayment());

        await act(async () => {
            await result.current.handleSubmission('100', 'project-123');
        });

        expect(getSurchargeData).toHaveBeenCalledWith('100');
    });

    it('should dispatch setPaymentData with expected payload', async () => {
        getSurchargeData.mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        const { result } = renderHook(() => useWccPayment());

        await act(async () => {
            await result.current.handleSubmission('100', 'project-123');
        });

        expect(dispatch).toHaveBeenCalledWith(
            setPaymentData({
                billSummary: [
                    { key: 'Service Name', value: 'WhatsApp for Business' },
                    { key: 'Amount', value: '100.00' },
                ],
                paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '10.00' }],
                totalAmount: 110,
                title: 'Bill Summary',
                payload: {
                    amount: '100',
                    project_id: 'project-123',
                    accessKey: 'whatsApp_for_busines',
                    currentUrl: window.location.href,
                },
                url: 'officeAndBusiness/whatsapp-business/payment',
                earningCashbackAmount: 5,
            } as PaymentState)
        );
    });

    it('should navigate to payments page', async () => {
        getSurchargeData.mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        const { result } = renderHook(() => useWccPayment());

        await act(async () => {
            await result.current.handleSubmission('100', 'project-123');
        });

        expect(navigate).toHaveBeenCalledWith('/payments');
    });

    it('should dispatch resetWhatsappBusinessState', async () => {
        getSurchargeData.mockResolvedValue({ surcharge: '10', corporateCashback: '5' });

        const { result } = renderHook(() => useWccPayment());

        await act(async () => {
            await result.current.handleSubmission('100', 'project-123');
        });

        expect(dispatch).toHaveBeenCalledWith(resetWhatsappBusinessState());
    });

    it('should handle case where getSurchargeData fails or returns undefined', async () => {
        getSurchargeData.mockResolvedValue(undefined);

        const { result } = renderHook(() => useWccPayment());

        await act(async () => {
            await result.current.handleSubmission('100', 'project-123');
        });

        expect(dispatch).toHaveBeenCalledWith(
            setPaymentData(
                expect.objectContaining({
                    totalAmount: 100, // No surcharge added
                    earningCashbackAmount: 0, // Default to zero
                })
            )
        );

        expect(navigate).toHaveBeenCalledWith('/payments');
        expect(dispatch).toHaveBeenCalledWith(resetWhatsappBusinessState());
    });
});

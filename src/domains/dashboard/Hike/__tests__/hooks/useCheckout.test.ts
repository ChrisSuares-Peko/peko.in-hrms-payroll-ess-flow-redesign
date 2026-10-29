import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setPaymentData } from '../../../payments/slices/payment';
import useCheckout from '../../hooks/useCheckout';
import GetSurcharge from '../../hooks/useSurchargeApi';

// Mock the dependencies
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../hooks/useSurchargeApi', () => ({
    default: vi.fn(),
}));

vi.mock('../../../payments/slices/payment', () => ({
    setPaymentData: vi.fn(),
}));

describe('useCheckout Hook', () => {
    const mockNavigate = useNavigate as any;
    const mockDispatch = useAppDispatch as any;
    const mockUseAppSelector = useAppSelector as any;
    const mockGetSurcharge = GetSurcharge as any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock the surcharge data from GetSurcharge
        mockGetSurcharge.mockReturnValue({
            surchargeData: {
                surcharge: '50',
                corporateCashback: '10',
            },
        });

        mockUseAppSelector.mockReturnValue({
            hikeArray: [
                { totalPrice: 300, logo: 'hikeLogo', name: 'Hike 1' },
                { totalPrice: 200, logo: 'hikeLogo', name: 'Hike 2' },
            ],
        });

        mockDispatch.mockReturnValue(vi.fn());

        mockNavigate.mockReturnValue(vi.fn());
    });

    it('should calculate the correct total amount and dispatch payment data', async () => {
        const { result } = renderHook(() => useCheckout());

        act(() => {
            result.current.handleSubmission();
        });

        expect(setPaymentData).toHaveBeenCalledWith({
            billSummary: [
                { key: 'Service name', value: 'Hike' },
                { key: 'Amount', value: '500.00' },
            ],
            paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 50.00' }],
            totalAmount: 550,
            title: 'Bill Summary',
            payload: {
                totalAmount: 500,
                payCashback: false,
                selectedHikes: [
                    { name: 'Hike 1', totalPrice: 300 },
                    { name: 'Hike 2', totalPrice: 200 },
                ],
                accessKey: 'hike_service',
            },
            url: 'purchase/hike/payment',
            earningCashbackAmount: 10,
        });

        // Check that the navigate function was called with the correct path
        // expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });
});

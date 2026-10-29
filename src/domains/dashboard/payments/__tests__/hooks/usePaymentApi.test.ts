import { load } from '@cashfreepayments/cashfree-js';
import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createPaymentLink,
    doWalletPayment,
    createPGTransaction,
    completePGPayment,
} from '../../api/index';
import usePaymentApi from '../../hooks/usePaymentApi';

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

vi.mock('@src/slices/userSlice', () => ({
    setUserInfo: vi.fn(),
}));

vi.mock('@cashfreepayments/cashfree-js', () => ({
    load: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    createPaymentLink: vi.fn(),
    doWalletPayment: vi.fn(),
    createPGTransaction: vi.fn(),
    completePGPayment: vi.fn(),
    createRazorpayOrder: vi.fn(),
    completeRazorpayPayment: vi.fn(),
}));

vi.mock('../../../plans/api', () => ({
    postApplyCoupon: vi.fn(),
}));

vi.mock('../../../CorporateTravel/store/visaSlice', () => ({
    setVisaOrderNumber: vi.fn(),
}));
const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('usePaymentApi', () => {
    let mockNavigate: any;
    const mockSetCheckoutJsInstance = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockNavigate = vi.fn();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
        load.mockResolvedValueOnce('checkoutJsInstance');
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    user: { balance: 1000 },
                    payment: { payload: { amount: 100 }, totalAmount: 100, url: 'someUrl' },
                    airline: { searchInitiatedAt: null },
                },
            })
        );
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should handle wallet payment request successfully', async () => {
        const mockResp = { bulkPaymentData: 'someData' };
        (doWalletPayment as Mock).mockResolvedValueOnce(mockResp);

        const { result } = renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: mockSetCheckoutJsInstance,
                checkoutJsInstance: null,
            })
        );

        act(() => {
            result.current.handleWalletPaymentRequest();
        });

        expect(result.current.isLoading).toBe(true);
        await new Promise(setImmediate); // wait for async code to complete

        expect(mockNavigate).toHaveBeenCalledWith(
            'payment-success?status=success&bulkPaymentData=%22someData%22'
        );
    });

    it('should handle Paytm payment request successfully', async () => {
        const mockResp = { session_id: 'sessionId', orderId: 'orderId' };
        (createPGTransaction as Mock).mockResolvedValueOnce(mockResp);
        (completePGPayment as Mock).mockResolvedValueOnce({ corporateFinalBalance: 1000 });

        const { result } = renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: mockSetCheckoutJsInstance,
                checkoutJsInstance: { checkout: vi.fn().mockResolvedValue({}) },
            })
        );

        await act(async () => {
            await result.current.handlePaytmPaymentRequest({ isChecked: true, balance: 100 });
        });

        expect(mockSetCheckoutJsInstance).toHaveBeenCalled();
    });

    it('should handle card payment request successfully', async () => {
        const mockResp = { redirectLink: 'http://redirect.url' };
        (createPaymentLink as Mock).mockResolvedValueOnce(mockResp);

        const { result } = renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: mockSetCheckoutJsInstance,
                checkoutJsInstance: null,
            })
        );

        act(() => {
            result.current.handleCardPaymentRequest({ isChecked: true, balance: 100 });
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.handleCardPaymentRequest({ isChecked: true, balance: 100 });
        });

        expect(window.location.href).toBe('http://localhost:3000/');
        expect(result.current.isLoading).toBe(false);
    });

    it('should display toast for invalid amount', async () => {
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 1, role: 'user' },
                    user: { balance: 1000 },
                    payment: { payload: { amount: -199 }, totalAmount: 100, url: 'someUrl' },
                    airline: { searchInitiatedAt: null },
                },
            })
        );
        const { result } = renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: mockSetCheckoutJsInstance,
                checkoutJsInstance: null,
            })
        );

        // Setting invalid amount in the payload (e.g., 0 or negative)
        act(() => {
            result.current.handleWalletPaymentRequest();
        });

        // Ensure showToast was called with the correct parameters
        expect(showToast).toHaveBeenCalledWith({
            description: 'Please enter a valid amount',
            variant: 'warning',
        });
    });

    it('should load the checkout script successfully', async () => {
        const { result } = renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: mockSetCheckoutJsInstance,
                checkoutJsInstance: null,
            })
        );

        await act(async () => {
            await result.current.loadCheckoutScript();
        });

        expect(load).toHaveBeenCalledWith({ mode: 'sandbox' });
        expect(mockSetCheckoutJsInstance).toHaveBeenCalledWith('checkoutJsInstance');
    });
});

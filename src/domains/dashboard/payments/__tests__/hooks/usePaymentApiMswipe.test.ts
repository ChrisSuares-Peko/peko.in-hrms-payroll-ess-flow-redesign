import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { postApplyCoupon } from '../../../plans/api';
import { initiateMswipePayment } from '../../api/index';
import usePaymentApi from '../../hooks/usePaymentApi';
import { PaymentMode } from '../../types/index';

vi.mock('@src/slices/apiSlice', () => ({ showToast: vi.fn() }));
vi.mock('@src/slices/userSlice', () => ({ setUserInfo: vi.fn() }));
vi.mock('@cashfreepayments/cashfree-js', () => ({ load: vi.fn() }));
vi.mock('../../api/index', () => ({ initiateMswipePayment: vi.fn() }));
vi.mock('../../../plans/api', () => ({ postApplyCoupon: vi.fn() }));
vi.mock('../../../CorporateTravel/store/visaSlice', () => ({ setVisaOrderNumber: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({
            reducer: {
                auth: { id: 7, role: 'corporate' },
                user: { user: { balance: 30 } },
                payment: {
                    payload: { amount: 100, accessKey: 'hotels_api' },
                    totalAmount: 100,
                    billSummary: [],
                    paymentSummary: [],
                    url: '',
                },
                airline: { searchInitiatedAt: null },
            },
        }),
}));

const PAYMENT_URL = 'https://pbl.mswipe.com/pay-by-link/payment-options?TransID=T1';

describe('usePaymentApi Mswipe checkout', () => {
    const assign = vi.fn();
    const trackEvent = vi.fn();
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('Moengage', { track_event: trackEvent });
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, assign },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    });

    const renderPaymentApi = () =>
        renderHook(() =>
            usePaymentApi({
                setCheckoutJsInstance: vi.fn(),
                checkoutJsInstance: null,
            })
        );

    it('creates the order and sends the buyer to Mswipe', async () => {
        (initiateMswipePayment as Mock).mockResolvedValueOnce({
            orderId: '1729',
            amount: '100.00',
            paymentUrl: PAYMENT_URL,
        });
        const { result } = renderPaymentApi();

        await act(async () => {
            await result.current.handleMswipePaymentRequest({ isChecked: false, balance: 30 });
        });

        expect(initiateMswipePayment).toHaveBeenCalledWith(
            expect.objectContaining({
                accessKey: 'hotels_api',
                pgAmount: 100,
                userId: 7,
                userType: 'corporate',
                couponCode: '',
            })
        );
        expect(assign).toHaveBeenCalledWith(PAYMENT_URL);
    });

    it('charges only the part the wallet does not cover', async () => {
        (initiateMswipePayment as Mock).mockResolvedValueOnce({
            orderId: '1729',
            amount: '70.00',
            paymentUrl: PAYMENT_URL,
        });
        const { result } = renderPaymentApi();

        await act(async () => {
            await result.current.handleMswipePaymentRequest({ isChecked: true, balance: 30 });
        });

        expect(initiateMswipePayment).toHaveBeenCalledWith(
            expect.objectContaining({ pgAmount: 70 })
        );
        expect(trackEvent).toHaveBeenCalledWith('payment_attempted', {
            service_name: 'N/A',
            amount: 70,
        });
    });

    it('stays on the page when the order cannot be created', async () => {
        (initiateMswipePayment as Mock).mockResolvedValueOnce(false);
        const { result } = renderPaymentApi();

        await act(async () => {
            await result.current.handleMswipePaymentRequest({ isChecked: false, balance: 0 });
        });

        expect(assign).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(showToast).not.toHaveBeenCalled();
    });

    const applyCouponWhileSelected = async (
        selected: PaymentMode,
        defaultGatewayMode?: PaymentMode
    ) => {
        (postApplyCoupon as Mock).mockResolvedValueOnce({ discountAmount: 10 });
        const { result } = renderPaymentApi();
        act(() => result.current.setselectedPayment(selected));

        await act(async () => {
            await result.current.applyCoupon('SAVE10', vi.fn(), defaultGatewayMode);
        });

        return result.current;
    };

    it.each([PaymentMode.PAYTM, PaymentMode.CCAVENUE, PaymentMode.MSWIPE])(
        'keeps a coupon payment on the selected %s gateway',
        async selected => {
            const paymentApi = await applyCouponWhileSelected(selected, PaymentMode.MSWIPE);

            expect(paymentApi.isCouponApplied).toBe(true);
            expect(paymentApi.selectedPayment).toBe(selected);
        }
    );

    it.each([PaymentMode.wallet, PaymentMode.card, PaymentMode.empty])(
        'moves a coupon payment from %s to the gateway the screen shows',
        async selected => {
            const paymentApi = await applyCouponWhileSelected(selected, PaymentMode.MSWIPE);

            expect(paymentApi.selectedPayment).toBe(PaymentMode.MSWIPE);
        }
    );

    it('moves a coupon payment off the wallet to Cashfree when the screen names no gateway', async () => {
        const paymentApi = await applyCouponWhileSelected(PaymentMode.wallet);

        expect(paymentApi.selectedPayment).toBe(PaymentMode.PAYTM);
    });

    it('tells the buyer when Mswipe returns no payment page', async () => {
        (initiateMswipePayment as Mock).mockResolvedValueOnce({
            orderId: '1729',
            amount: '100.00',
        });
        const { result } = renderPaymentApi();

        await act(async () => {
            await result.current.handleMswipePaymentRequest({ isChecked: false, balance: 0 });
        });

        expect(assign).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({
                description:
                    'Something went wrong. If the issue persists, please contact support at reach@peko.one',
            })
        );
    });
});

import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { PaymentMode } from '../../../payments/types/index';
import PaymentSummary from '../../components/PaymentSummary';

const paymentState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const gatewayState = vi.hoisted(() => ({
    limits: {} as Record<string, number>,
    provider: 'MSWIPE' as string | null,
}));
const paymentApi = vi.hoisted(() => ({
    selectedPayment: '' as string,
    setselectedPayment: vi.fn(),
    handlePaytmPaymentRequest: vi.fn(),
    handleMswipePaymentRequest: vi.fn(),
    loadCheckoutScript: vi.fn(),
    applyCoupon: vi.fn(),
}));
const methodCardProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const couponCardProps = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock('@src/slices/apiSlice', async importOriginal => ({
    ...(await importOriginal<typeof import('@src/slices/apiSlice')>()),
    showToast: vi.fn((payload: unknown) => ({ type: 'api/showToast', payload })),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({
            reducer: {
                payment: paymentState.current,
                user: { user: { roleName: 'corporate' } },
                auth: { role: 'corporate', id: 1 },
            },
        }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../../payments/hooks/usePaymentApi', () => ({
    default: () => ({
        handleCardPaymentRequest: vi.fn(),
        handlePaytmPaymentRequest: paymentApi.handlePaytmPaymentRequest,
        handleWalletPaymentRequest: vi.fn(),
        handleCCavenuePaymentRequest: vi.fn(),
        handleMswipePaymentRequest: paymentApi.handleMswipePaymentRequest,
        ccavenueUrl: null,
        setCCavenueUrl: vi.fn(),
        isLoading: false,
        isSpinnerLoading: false,
        loadCheckoutScript: paymentApi.loadCheckoutScript,
        couponFormikRef: { current: null },
        couponCode: '',
        setCouponCode: vi.fn(),
        applyCoupon: paymentApi.applyCoupon,
        removeCoupon: vi.fn(),
        isCouponApplied: false,
        selectedPayment: paymentApi.selectedPayment,
        setselectedPayment: paymentApi.setselectedPayment,
        isCashbackChecked: false,
        setIsCashbackChecked: vi.fn(),
    }),
}));

vi.mock('../../../payments/hooks/useWalletApi', () => ({
    default: () => ({ walletData: { balance: 0 }, isLoading: false }),
}));

vi.mock('../../../payments/hooks/useGetAllPaymentMode', () => ({
    default: () => ({
        isPgOptionsLoading: false,
        isPgDown: false,
        getPaymentMethods: vi.fn(),
        availablePgOptions: {
            wallet: { available: false, limits: {}, usage: { today: 0, month: 0 } },
            gateway: {
                available: true,
                provider: gatewayState.provider,
                limits: gatewayState.limits,
                usage: { today: 0, month: 0 },
            },
        },
    }),
}));

vi.mock('../../../Airline/hooks/useTraceIdTimer', () => ({
    default: () => ({
        searchInitiatedAt: null,
        bookingCompletedAt: null,
        isExpired: false,
        isPaymentExpired: false,
        timeRemaining: 0,
        formatTime: () => '',
        showExpiredModal: false,
        handleGoBack: vi.fn(),
    }),
}));

vi.mock('../../../Hotels/hooks/useHotelBookingTimer', () => ({
    default: () => ({
        searchInitiatedAt: null,
        showTimer: false,
        isExpired: false,
        timeRemaining: 0,
        formatTime: () => '',
    }),
}));

vi.mock('../../components/PaymentHeader', () => ({ default: () => null }));
vi.mock('../../components/PaymentMethodCard', () => ({
    default: (props: Record<string, unknown>) => {
        methodCardProps.current = props;
        return <div data-testid="payment-methods" />;
    },
}));
vi.mock('../../components/BillSummaryCard', () => ({
    default: () => null,
    BillSummaryCardSkeleton: () => null,
}));
vi.mock('../../components/CouponCodeCard', () => ({
    default: (props: Record<string, unknown>) => {
        couponCardProps.current = props;
        return null;
    },
}));
vi.mock('../../components/PaymentRedirectLoader', () => ({ default: () => null }));
vi.mock('../../../payments/components/CCavenueIframeModal', () => ({ default: () => null }));
vi.mock('../../../Airline/components/SessionExpiredModal', () => ({ default: () => null }));

const stateFor = (payload: Record<string, unknown>) => ({
    billSummary: [{ key: 'Service name', value: 'Hotels' }],
    paymentSummary: [],
    title: 'Booking Summary',
    payload: { amount: 500, ...payload },
    totalAmount: 500,
    earningCashbackAmount: 0,
    isEsimPaymentLoading: false,
});

const pay = () =>
    act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^Pay ₹/ }));
    });

describe('PaymentSummary Mswipe gateway', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        gatewayState.provider = 'MSWIPE';
        gatewayState.limits = {};
        paymentApi.selectedPayment = PaymentMode.empty;
        methodCardProps.current = {};
        couponCardProps.current = {};
        paymentState.current = stateFor({ accessKey: accessKeys.hotels });
    });

    const applyCouponFromCard = (setSubmitting: (isSubmitting: boolean) => void) =>
        (couponCardProps.current.applyCoupon as (...args: unknown[]) => void)(
            'SAVE10',
            setSubmitting
        );

    it('offers coupons alongside Mswipe and falls back to Mswipe', () => {
        const setSubmitting = vi.fn();

        render(<PaymentSummary />);
        applyCouponFromCard(setSubmitting);

        expect(paymentApi.applyCoupon).toHaveBeenCalledWith(
            'SAVE10',
            setSubmitting,
            PaymentMode.MSWIPE
        );
    });

    it('leaves the coupon gateway to the hook when Mswipe is not shown', () => {
        gatewayState.provider = 'CASHFREE';
        const setSubmitting = vi.fn();

        render(<PaymentSummary />);
        applyCouponFromCard(setSubmitting);

        expect(paymentApi.applyCoupon).toHaveBeenCalledWith('SAVE10', setSubmitting, undefined);
    });

    it('shows Mswipe instead of Cashfree when the API picks Mswipe', () => {
        render(<PaymentSummary />);

        expect(methodCardProps.current.showMswipeOption).toBe(true);
        expect(methodCardProps.current.showGatewayOption).toBe(false);
        expect(paymentApi.setselectedPayment).toHaveBeenCalledWith(PaymentMode.MSWIPE);
    });

    it.each([
        ['Cashfree', 'CASHFREE'],
        ['no gateway', null],
    ])('keeps Cashfree when the API picks %s', (_label, provider) => {
        gatewayState.provider = provider;

        render(<PaymentSummary />);

        expect(methodCardProps.current.showMswipeOption).toBe(false);
        expect(methodCardProps.current.showGatewayOption).toBe(true);
        expect(paymentApi.setselectedPayment).toHaveBeenCalledWith(PaymentMode.PAYTM);
    });

    it('pays through Mswipe when it is selected', async () => {
        paymentApi.selectedPayment = PaymentMode.MSWIPE;

        render(<PaymentSummary />);
        await pay();

        expect(paymentApi.handleMswipePaymentRequest).toHaveBeenCalledWith({
            isChecked: false,
            balance: 0,
        });
        expect(paymentApi.handlePaytmPaymentRequest).not.toHaveBeenCalled();
    });

    it('holds Mswipe to the payment gateway limits', async () => {
        gatewayState.limits = { limitPerTransaction: 100 };
        paymentApi.selectedPayment = PaymentMode.MSWIPE;

        render(<PaymentSummary />);
        await pay();

        expect(paymentApi.handleMswipePaymentRequest).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({
                description: expect.stringContaining(
                    'Your payment gateway transaction limit has been exceeded.'
                ),
            })
        );
    });

    it('keeps bill payments on CC Avenue', () => {
        paymentState.current = stateFor({ accessKey: accessKeys.postpaid });

        render(<PaymentSummary />);

        expect(methodCardProps.current.showMswipeOption).toBe(false);
        expect(paymentApi.setselectedPayment).toHaveBeenCalledWith(PaymentMode.CCAVENUE);
    });

    it.each([
        ['other bill payments', { accessKey: accessKeys.education }],
        ['biller payments', { accessKey: accessKeys.hotels, billerId: 'B1' }],
        ['Office Supplies', { accessKey: accessKeys.officeSupplies }],
        ['ONDC orders', { accessKey: accessKeys.hotels, isOndc: true }],
        [
            'WhatsApp mandates',
            { accessKey: accessKeys.whatsappBasic, isWhatsAppSubscription: true },
        ],
    ])('keeps %s off Mswipe', (_label, payload) => {
        paymentState.current = stateFor(payload);

        render(<PaymentSummary />);

        expect(methodCardProps.current.showMswipeOption).toBe(false);
        expect(methodCardProps.current.showGatewayOption).toBe(true);
    });
});

import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSurcharge } from '@src/services/surcharge';

import { PaymentMode } from '../../../payments/types/index';
import PaymentSummary from '../../components/PaymentSummary';

const paymentState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const paymentApi = vi.hoisted(() => ({ selectedPayment: undefined as string | undefined }));

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

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ xs: false }),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../../payments/hooks/usePaymentApi', () => ({
    default: () => ({
        handleCardPaymentRequest: vi.fn(),
        handlePaytmPaymentRequest: vi.fn(),
        handleWalletPaymentRequest: vi.fn(),
        handleCCavenuePaymentRequest: vi.fn(),
        ccavenueUrl: null,
        setCCavenueUrl: vi.fn(),
        isLoading: false,
        isSpinnerLoading: false,
        loadCheckoutScript: vi.fn(),
        couponFormikRef: { current: null },
        couponCode: '',
        setCouponCode: vi.fn(),
        applyCoupon: vi.fn(),
        removeCoupon: vi.fn(),
        isCouponApplied: false,
        selectedPayment: paymentApi.selectedPayment ?? PaymentMode.empty,
        setselectedPayment: vi.fn(),
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
            gateway: { available: true, limits: {}, usage: { today: 0, month: 0 } },
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
    default: () => <div data-testid="payment-methods" />,
}));
vi.mock('../../components/CouponCodeCard', () => ({ default: () => null }));
vi.mock('../../components/PaymentRedirectLoader', () => ({ default: () => null }));
vi.mock('../../../payments/components/CCavenueIframeModal', () => ({ default: () => null }));
vi.mock('../../../Airline/components/SessionExpiredModal', () => ({ default: () => null }));

const baseState = {
    billSummary: [
        { key: 'Service name', value: 'Mobile Postpaid' },
        { key: 'Amount', value: '124.00', isInput: false },
    ],
    paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 0.00' }],
    title: 'Recharge Summary',
    payload: { accessKey: 'bbps_telecom_postpaid', amount: -124, billerId: 'B1' },
    url: 'payment/postpaid/payment',
    minimumAmount: 1,
    maximumAmount: 1000000,
    earningCashbackAmount: 0,
    navigatePath: '/mobile-recharge-&-bills/postpaid',
    isEsimPaymentLoading: false,
};

describe('PaymentSummary when the fetched bill is a credit', () => {
    beforeEach(() => {
        paymentState.current = { ...baseState, totalAmount: 0, creditBalance: 124 };
        render(<PaymentSummary />);
    });

    it('disables the pay button preemptively and labels it No Payment Due', () => {
        const button = screen.getByRole('button', { name: 'No Payment Due' });
        expect(button).toBeDisabled();
        expect(screen.queryByRole('button', { name: /^Pay ₹/ })).not.toBeInTheDocument();
    });

    it('shows an amount payable of zero', () => {
        expect(screen.getByText('Amount Payable').nextElementSibling?.textContent).toBe('₹ 0.00');
    });

    it('shows the credit as a positive tagged amount with the info banner', () => {
        expect(screen.getByText('Credit').parentElement?.textContent).toBe('Credit₹ 124.00');
        expect(screen.getByRole('status').textContent).toBe(
            'Your account has a credit balance of ₹124.00. No payment is due at this time.'
        );
    });

    it('keeps Cancel and go back active', () => {
        expect(screen.getByRole('button', { name: 'Cancel and go back' })).toBeEnabled();
    });
});

describe('PaymentSummary when a payment is due', () => {
    it('renders the normal pay label with no credit banner', () => {
        paymentState.current = {
            ...baseState,
            billSummary: [
                { key: 'Service name', value: 'Mobile Postpaid' },
                { key: 'Amount', value: '248.00', isInput: false },
            ],
            payload: { accessKey: 'bbps_telecom_postpaid', amount: 248, billerId: 'B1' },
            totalAmount: 248,
            creditBalance: null,
        };
        render(<PaymentSummary />);
        expect(screen.getByRole('button', { name: 'Pay ₹ 248.00' })).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByText('Credit')).not.toBeInTheDocument();
        expect(screen.getByText('Amount Payable').nextElementSibling?.textContent).toBe('₹ 248.00');
    });
});

describe('PaymentSummary while the amount is being changed', () => {
    const feeResponse = { surcharge: '206.50', ccf1Amount: '0', corporateCashback: '0' };

    const deferred = () => {
        let resolve: (value: unknown) => void = () => {};
        const promise = new Promise(res => {
            resolve = res;
        });
        return { promise, resolve };
    };

    const payButton = () => screen.getByRole('button', { name: /^Pay ₹/ });
    const startEditing = () => fireEvent.click(screen.getByRole('img', { name: 'edit' }));
    const finishEditing = () => fireEvent.blur(screen.getByRole('spinbutton'));

    beforeEach(() => {
        vi.mocked(getSurcharge).mockReset();
        paymentApi.selectedPayment = PaymentMode.CCAVENUE;
        paymentState.current = {
            ...baseState,
            billSummary: [
                { key: 'Service name', value: 'FASTag Recharge' },
                { key: 'Amount', value: 350, isInput: true },
            ],
            paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: '₹ 20.65' }],
            payload: { accessKey: 'bbps_utility_fastag', amount: 350, billerId: 'B1' },
            totalAmount: 370.65,
            minimumAmount: 350,
            maximumAmount: 8863.99,
            creditBalance: null,
        };
        render(<PaymentSummary />);
    });

    afterEach(() => {
        paymentApi.selectedPayment = undefined;
    });

    it('allows paying before the amount is touched', () => {
        expect(payButton()).toBeEnabled();
    });

    it('disables Pay as soon as the amount is opened for editing', () => {
        startEditing();
        expect(payButton()).toBeDisabled();
    });

    it('keeps Pay disabled until the new platform fee has loaded', async () => {
        const fee = deferred();
        vi.mocked(getSurcharge).mockReturnValue(fee.promise as ReturnType<typeof getSurcharge>);

        startEditing();
        finishEditing();
        expect(getSurcharge).toHaveBeenCalledWith(expect.objectContaining({ amount: 350 }));
        expect(payButton()).toBeDisabled();

        await act(async () => fee.resolve(feeResponse));
        expect(payButton()).toBeEnabled();
    });

    it('keeps Pay disabled when the platform fee fails to load', async () => {
        vi.mocked(getSurcharge).mockResolvedValue(false);

        startEditing();
        await act(async () => {
            finishEditing();
        });

        expect(payButton()).toBeDisabled();
    });

    it('ignores the fee for an earlier amount once the amount has been changed again', async () => {
        const earlier = deferred();
        const latest = deferred();
        vi.mocked(getSurcharge)
            .mockReturnValueOnce(earlier.promise as ReturnType<typeof getSurcharge>)
            .mockReturnValueOnce(latest.promise as ReturnType<typeof getSurcharge>);

        startEditing();
        finishEditing();
        startEditing();
        finishEditing();

        await act(async () => earlier.resolve(feeResponse));
        expect(payButton()).toBeDisabled();

        await act(async () => latest.resolve(feeResponse));
        expect(payButton()).toBeEnabled();
    });

    it('does not let a fee arriving mid-edit re-enable Pay', async () => {
        const fee = deferred();
        vi.mocked(getSurcharge).mockReturnValue(fee.promise as ReturnType<typeof getSurcharge>);

        startEditing();
        finishEditing();
        startEditing();

        await act(async () => fee.resolve(feeResponse));
        expect(payButton()).toBeDisabled();
    });
});

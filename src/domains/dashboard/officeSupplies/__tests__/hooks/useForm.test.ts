import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';

import { addSavedAddressApi } from '../../api/address';
import { initOrderApi } from '../../api/cart';
import { getPosition } from '../../hooks/useCurrentLocation';
import useForm from '../../hooks/useForm';

const mockNavigate = vi.fn();
// Buy Now carries its checkout scope in the query string (see useBuyNowScope);
// tests drive it by setting mockSearchParams.
let mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
}));

vi.mock('../../api/cart', () => ({ initOrderApi: vi.fn() }));
vi.mock('../../api/address', () => ({ addSavedAddressApi: vi.fn() }));
vi.mock('@src/services/surcharge', () => ({ getSurcharge: vi.fn() }));
vi.mock('../../hooks/useCurrentLocation', () => ({ getPosition: vi.fn() }));

vi.mock('../../hooks/useGetBasicInfo', () => ({
    default: () => ({ data: { name: 'Acme Pvt Ltd', email: 'buyer@example.com' } }),
}));
vi.mock('../../hooks/useSurchargeApi', () => ({
    default: () => ({ surchargeData: { surcharge: '11.80', corporateCashback: '5' }, isLoading: false }),
}));

vi.mock('@src/slices/apiSlice', () => ({
    default: (state = {}) => state,
    showToast: vi.fn(payload => ({ type: 'api/showToast', payload })),
}));

const mockDispatch = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

const validatedGroup = {
    bppId: 'bpp.example.com',
    bppUri: 'https://bpp.example.com',
    providerId: 'P1',
    vendorName: 'Acme Stationery',
    cartItems: [],
    transactionId: 'txn-1',
    status: 'validated',
    quote: null,
};

const initializedGroup = {
    ...validatedGroup,
    status: 'initialized',
    quote: { total: 1040, currency: 'INR', rows: [], items: [], deliveryCharge: 0, otherCharges: 0 },
    payment: {},
};

const address = {
    contactName: 'Asha Rao',
    firstName: 'Asha Rao',
    lastName: '',
    phoneNumber: '9876543210',
    address: '12 MG Road',
    pincode: '560001',
    businessName: 'Acme Pvt Ltd',
    saveAddress: false,
} as any;

const dispatched = (type: string) =>
    mockDispatch.mock.calls.map(call => call[0]).find(action => action?.type === type);

describe('useForm — checkout handoff to the shared /payments screen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 7, role: 'corporate' },
                    cart: {
                        totalGst: 100,
                        cartId: 55,
                        itemsTotalAmount: 1000,
                        shippingCharge: 0,
                        items: [],
                        validation: { groups: [validatedGroup], anyValidated: true, validatedTotal: 1000 },
                    },
                },
            })
        );
        (getSurcharge as Mock).mockResolvedValue({ surcharge: '12.26', corporateCashback: '5' });
        (getPosition as Mock).mockResolvedValue(null);
    });

    // The network refuses an /init whose fulfillment end carries no valid
    // coordinate, and the backend's profile-latLng fallback is often unset — so
    // the browser location has to travel with the address, not just with the
    // earlier "Validate with seller" call.
    it('sends the browser location alongside the address', async () => {
        (getPosition as Mock).mockResolvedValue({
            coords: { latitude: 12.9715987, longitude: 77.5945627 },
        });
        (initOrderApi as Mock).mockResolvedValue({
            groups: [initializedGroup],
            initializedTotal: 1040,
            allInitialized: true,
            anyInitialized: true,
            failedCount: 0,
        });

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(initOrderApi).toHaveBeenCalledWith(
            expect.objectContaining({ gps: '12.9715987,77.5945627' })
        );
    });

    it('omits gps when the browser denies location, leaving the profile fallback', async () => {
        (getPosition as Mock).mockResolvedValue(null);
        (initOrderApi as Mock).mockResolvedValue({
            groups: [initializedGroup],
            initializedTotal: 1040,
            allInitialized: true,
            anyInitialized: true,
            failedCount: 0,
        });

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect((initOrderApi as Mock).mock.calls[0][0].gps).toBeUndefined();
    });

    it('runs ONDC /init, prices off the initialized total and hands off to /payments', async () => {
        (initOrderApi as Mock).mockResolvedValue({
            groups: [initializedGroup],
            initializedTotal: 1040,
            allInitialized: true,
            anyInitialized: true,
            failedCount: 0,
        });

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        // init reuses the select validation's transaction ids
        expect(initOrderApi).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 7,
                userType: 'corporate',
                pincode: '560001',
                name: 'Asha Rao',
                phone: '9876543210',
                addressLine: '12 MG Road',
                email: 'buyer@example.com',
                groups: [
                    { bppUri: 'https://bpp.example.com', providerId: 'P1', transactionId: 'txn-1' },
                ],
            })
        );

        // the platform fee is re-priced against the amount we are about to charge,
        // so pgAmount matches what the backend's validateAmount recomputes
        expect(getSurcharge).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 1040, accessKey: 'ecommerce' })
        );

        const paymentData = dispatched('payment/setPaymentData');
        expect(paymentData.payload.payload.amount).toBe(1040);
        expect(paymentData.payload.totalAmount).toBe(1052.26);
        expect(paymentData.payload.payload.accessKey).toBe('ecommerce');
        expect(paymentData.payload.payload.isOndc).toBe(true);
        expect(paymentData.payload.url).toBeNull();
        // the seam: the shared engine redirects here once Cashfree settles
        expect(paymentData.payload.successPath).toBe('/office-supplies/placing-order');
        expect(paymentData.payload.payload.successUrl).toBe('/office-supplies/placing-order');
        expect(paymentData.payload.navigatePath).toBe('/office-supplies/cart/checkout');

        expect(dispatched('cart/setInitialization')).toBeTruthy();
        expect(mockNavigate).toHaveBeenCalledWith('/payments');
    });

    it('keeps the buyer on checkout and charges nothing when /init fails for every seller', async () => {
        (initOrderApi as Mock).mockResolvedValue({
            groups: [{ ...validatedGroup, status: 'failed', vendorName: 'Acme Stationery' }],
            initializedTotal: 0,
            allInitialized: false,
            anyInitialized: false,
            failedCount: 1,
        });

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(dispatched('payment/setPaymentData')).toBeUndefined();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(getSurcharge).not.toHaveBeenCalled();
        expect(dispatched('api/showToast')).toBeTruthy();
    });

    it('opens the unavailable-items flow instead of paying when some sellers fail /init', async () => {
        const failedItem = {
            productId: 9,
            ondcProductId: 'ITEM-OTHER',
            productName: 'Stapler',
            productQuantity: 1,
        };
        (initOrderApi as Mock).mockResolvedValue({
            groups: [
                initializedGroup,
                {
                    ...validatedGroup,
                    status: 'failed',
                    reason: 'not_serviceable',
                    vendorName: 'Other Seller',
                    cartItems: [failedItem],
                },
            ],
            initializedTotal: 1040,
            allInitialized: false,
            anyInitialized: true,
            failedCount: 1,
        });

        const onUnavailableItems = vi.fn();
        const { result } = renderHook(() => useForm({ onUnavailableItems }));
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(onUnavailableItems).toHaveBeenCalledWith([
            expect.objectContaining({
                productId: 9,
                productName: 'Stapler',
                vendorName: 'Other Seller',
                reason: 'The seller cannot deliver this to your pincode.',
            }),
        ]);
        expect(dispatched('payment/setPaymentData')).toBeUndefined();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(getSurcharge).not.toHaveBeenCalled();
        expect(dispatched('cart/setInitialization').payload).toBeNull();
    });

    it('does not pay on a partial /init failure even without a modal callback', async () => {
        (initOrderApi as Mock).mockResolvedValue({
            groups: [
                initializedGroup,
                { ...validatedGroup, status: 'failed', vendorName: 'Other Seller' },
            ],
            initializedTotal: 1040,
            allInitialized: false,
            anyInitialized: true,
            failedCount: 1,
        });

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(dispatched('payment/setPaymentData')).toBeUndefined();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(dispatched('api/showToast')).toBeTruthy();
    });
});

// Regression guard: the checkout rewrite (b9def43ce) dropped the address-save
// call along with ReviewPaymentPage, so ticking "Save this address for next
// time" silently did nothing.
describe('useForm — "Save this address for next time"', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams();
        (useAppSelector as unknown as any).mockImplementation((selectorFn: any) =>
            selectorFn({
                reducer: {
                    auth: { id: 7, role: 'corporate' },
                    cart: {
                        totalGst: 100,
                        cartId: 55,
                        itemsTotalAmount: 1000,
                        shippingCharge: 0,
                        items: [],
                        validation: { groups: [validatedGroup], anyValidated: true, validatedTotal: 1000 },
                    },
                },
            })
        );
        (getSurcharge as Mock).mockResolvedValue({ surcharge: '12.26', corporateCashback: '5' });
        (initOrderApi as Mock).mockResolvedValue({
            groups: [initializedGroup],
            initializedTotal: 1040,
            allInitialized: true,
            anyInitialized: true,
            failedCount: 0,
        });
        (addSavedAddressApi as Mock).mockResolvedValue(true);
    });

    it('saves the address, translating the form fields to the API names', async () => {
        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission({ ...address, saveAddress: true });
        });

        // The form calls these address/pincode/businessName; the API wants
        // addressLine1/zipCode/nickname. Posting `values` raw persists nothing.
        expect(addSavedAddressApi).toHaveBeenCalledTimes(1);
        expect(addSavedAddressApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            name: 'Asha Rao',
            addressLine1: '12 MG Road',
            phoneNumber: '9876543210',
            zipCode: '560001',
            nickname: 'Acme Pvt Ltd',
        });
    });

    it('does not save when the box is left unticked', async () => {
        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(addSavedAddressApi).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/payments');
    });

    it('orders the whole cart when there is no Buy Now scope', async () => {
        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(initOrderApi).toHaveBeenCalledWith(
            expect.objectContaining({ ondcProductIds: undefined })
        );
    });

    // /init re-derives its item set from the cart — the `groups` it receives are
    // only transaction-id hints — so without this the order widens to the cart.
    it('scopes the order to the Buy Now product', async () => {
        mockSearchParams = new URLSearchParams('buyNow=ITEM-XYZ');

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission(address);
        });

        expect(initOrderApi).toHaveBeenCalledWith(
            expect.objectContaining({ ondcProductIds: ['ITEM-XYZ'] })
        );
    });

    it('still places the order when saving the address fails', async () => {
        (addSavedAddressApi as Mock).mockResolvedValue('Failed to save address');

        const { result } = renderHook(() => useForm());
        await act(async () => {
            await result.current.handleSubmission({ ...address, saveAddress: true });
        });

        expect(initOrderApi).toHaveBeenCalled();
        expect(dispatched('payment/setPaymentData')).toBeTruthy();
        expect(mockNavigate).toHaveBeenCalledWith('/payments');
    });
});

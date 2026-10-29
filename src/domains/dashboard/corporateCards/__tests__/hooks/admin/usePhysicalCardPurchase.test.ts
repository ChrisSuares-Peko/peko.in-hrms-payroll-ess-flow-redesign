import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { preflightPhysicalCardOrder } from '../../../api/admin/issueCardApi';
import { getPhysicalCardPricing } from '../../../api/admin/physicalCardPricingApi';
import { usePhysicalCardPurchase } from '../../../hooks/admin/usePhysicalCardPurchase';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/physicalCardPricingApi', () => ({
    getPhysicalCardPricing: vi.fn(),
}));

vi.mock('../../../api/admin/issueCardApi', () => ({
    preflightPhysicalCardOrder: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    default: (state: unknown = {}) => state,
    showToast: vi.fn((payload: unknown) => ({ type: 'apiSlice/showToast', payload })),
}));

interface SummaryRow {
    key: string;
    value: string | number;
}

const mockAuth = { reducer: { auth: { role: 'corporate', id: 7 } } };

const pricing = {
    unitPrice: 100,
    quantity: 1,
    taxableAmount: 100,
    taxAmount: 18,
    taxRate: 18,
    expectedPaymentAmount: 118,
};

const delivery = {
    nameOnCard: 'Aj foru',
    fullName: 'Aj foru',
    mobileNumber: '9876543210',
    addressLine1: 'A1 Street',
    city: 'Kochi',
    state: 'Kerala',
    pinCode: '682001',
};

const startArgs = { cardIssuanceId: 'ci-1', holderName: 'Aj foru', delivery };

describe('usePhysicalCardPurchase', () => {
    let dispatch: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatch = vi.fn();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
        (getPhysicalCardPricing as unknown as Mock).mockResolvedValue(pricing);
        (preflightPhysicalCardOrder as unknown as Mock).mockResolvedValue({
            ok: true,
            reason: null,
            message: null,
        });
    });

    const dispatchedPayload = async () => {
        const { result } = renderHook(() => usePhysicalCardPurchase());
        await act(async () => {
            await result.current.startPurchase(startArgs);
        });
        return dispatch.mock.calls[0][0].payload;
    };

    it('hands the bill to the shared payment screen', async () => {
        await dispatchedPayload();

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.payments);
    });

    it('pre-formats every payment summary value as rupees with decimals', async () => {
        const payload = await dispatchedPayload();

        payload.paymentSummary.forEach((row: SummaryRow) => {
            expect(String(row.value)).toMatch(/^₹ [\d,]+\.\d{2}$/);
        });
    });

    it('shows the price like a plan purchase: subtotal, then GST, with no platform fee', async () => {
        const payload = await dispatchedPayload();

        expect(payload.paymentSummary).toEqual([
            { key: 'Subtotal', value: '₹ 100.00' },
            { key: 'GST (18%)', value: '₹ 18.00' },
        ]);
    });

    it('drops the GST row when the server charges no tax', async () => {
        (getPhysicalCardPricing as unknown as Mock).mockResolvedValue({
            ...pricing,
            taxAmount: 0,
            taxRate: 0,
            expectedPaymentAmount: 100,
        });
        const payload = await dispatchedPayload();

        expect(payload.paymentSummary.map((row: SummaryRow) => row.key)).toEqual(['Subtotal']);
        expect(payload.totalAmount).toBe(100);
    });

    it('sends exactly the server-priced amounts', async () => {
        const payload = await dispatchedPayload();

        expect(typeof payload.totalAmount).toBe('number');
        expect(payload.totalAmount).toBe(118);
        expect(payload.payload).toEqual(
            expect.objectContaining({ amount: 100, pgAmount: 118, quantity: 1 })
        );
    });

    it('keeps the wallet off the payment screen for this purchase', async () => {
        const payload = await dispatchedPayload();

        expect(payload.payload.isCashfreeOnly).toBe(true);
        expect(payload.url).toBeNull();
    });

    it('claims no bespoke success destination, so the shared success screen renders', async () => {
        const payload = await dispatchedPayload();

        expect(payload.successPath).toBeUndefined();
        expect(payload.payload.successUrl).toBeUndefined();
    });

    it('keeps the cards page as the cancel destination', async () => {
        const payload = await dispatchedPayload();

        expect(payload.navigatePath).toBe(`/${paths.dashboard.corporateCard}`);
    });

    it('does not start a payment when the price cannot be read, and says so', async () => {
        (getPhysicalCardPricing as unknown as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => usePhysicalCardPurchase());
        let returned;

        await act(async () => {
            returned = await result.current.startPurchase(startArgs);
        });

        expect(returned).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('proves the order is possible before taking any money', async () => {
        const { result } = renderHook(() => usePhysicalCardPurchase());
        await act(async () => {
            await result.current.startPurchase({ ...startArgs, cardRequestId: 31 });
        });

        expect(preflightPhysicalCardOrder).toHaveBeenCalledWith('corporate', 7, {
            cardIssuanceId: 'ci-1',
            cardRequestId: 31,
        });
    });

    it.each([
        ['the cardholder has not finished KYC', { ok: false, reason: 'KYC_INCOMPLETE', message: 'The cardholder has not completed KYC yet.' }],
        ['the source card is frozen', { ok: false, reason: 'SOURCE_FROZEN', message: 'You cannot order a physical card for a frozen card.' }],
        ['the request was already decided', { ok: false, reason: 'REQUEST_DECIDED', message: 'This request has already been decided.' }],
    ])('never reaches the payment screen when %s', async (_label, preflight) => {
        (preflightPhysicalCardOrder as unknown as Mock).mockResolvedValue(preflight);
        const { result } = renderHook(() => usePhysicalCardPurchase());
        let returned;

        await act(async () => {
            returned = await result.current.startPurchase(startArgs);
        });

        expect(returned).toBe(false);
        expect(getPhysicalCardPricing).not.toHaveBeenCalled();
        expect(dispatch).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({ variant: 'error', description: preflight.message })
        );
    });

    it('stops rather than guess when the check itself cannot be reached', async () => {
        (preflightPhysicalCardOrder as unknown as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => usePhysicalCardPurchase());
        let returned;

        await act(async () => {
            returned = await result.current.startPurchase(startArgs);
        });

        expect(returned).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

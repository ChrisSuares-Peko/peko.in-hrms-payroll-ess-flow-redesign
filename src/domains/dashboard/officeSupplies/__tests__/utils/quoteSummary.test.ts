import { describe, expect, it } from 'vitest';

import { formatInr } from '../../utils/priceInr';
import {
    getItemsTotal,
    getOtherChargeRows,
    getValidatedSummary,
    isQuoteValidated,
} from '../../utils/quoteSummary';

describe('isQuoteValidated', () => {
    it('is false without a parked /select result', () => {
        expect(isQuoteValidated(null)).toBe(false);
        expect(isQuoteValidated(undefined)).toBe(false);
    });

    it('is false when no seller group validated', () => {
        expect(isQuoteValidated({ anyValidated: false, validatedTotal: 500 })).toBe(false);
    });

    it('is false for a validated group that came back with no real price', () => {
        expect(isQuoteValidated({ anyValidated: true, validatedTotal: 0 })).toBe(false);
    });

    it('is true only for a validated, priced quote', () => {
        expect(isQuoteValidated({ anyValidated: true, validatedTotal: 996.25 })).toBe(true);
    });
});

describe('formatInr', () => {
    it('formats numbers with a single spaced ₹ and en-IN grouping', () => {
        expect(formatInr(1234.5)).toBe('₹\u00A01,234.50');
        expect(formatInr(0)).toBe('₹\u00A00.00');
        expect(formatInr(null)).toBe('₹\u00A00.00');
    });

    it('does not put a wrapping space between the rupee symbol and the amount', () => {
        expect(formatInr(59999)).not.toMatch(/₹ /);
        expect(formatInr(59999)).toContain('\u00A0');
    });

    // Some ONDC sellers send price.value as "₹50.00"; Number() made that NaN,
    // so the row rendered "₹NaN". Strip whatever is there, add the symbol once.
    it('does not double the symbol or render NaN when the value already has one', () => {
        expect(formatInr('₹50.00')).toBe('₹\u00A050.00');
        expect(formatInr('Rs. 50')).toBe('₹\u00A050.00');
    });
});

describe('quoteSummary', () => {
    // The reported bug: order 45 showed Items ₹50 + Delivery ₹30 + Platform fee
    // ₹19 = ₹99 against a ₹109 total, because the seller's ₹10 packing row was
    // subtracted out of "Items total" and never rendered.
    const order45Quote = {
        total: 90,
        deliveryCharge: 30,
        otherCharges: [{ title: 'Packing charges', type: 'packing', amount: 10 }],
    };

    it('reconciles the summary rows to what was actually paid', () => {
        const platformFee = 19;
        const amountPaid = 109;

        const itemsTotal = getItemsTotal(order45Quote);
        const charges = getOtherChargeRows(order45Quote);

        expect(itemsTotal).toBe(50);
        expect(charges).toEqual([{ label: 'Packing charges', amount: 10 }]);

        const rowsSum =
            itemsTotal +
            order45Quote.deliveryCharge +
            charges.reduce((s, c) => s + c.amount, 0) +
            platformFee;
        expect(rowsSum).toBe(amountPaid);
    });

    it('drops zero-amount charge rows', () => {
        const rows = getOtherChargeRows({
            total: 90,
            deliveryCharge: 30,
            otherCharges: [
                { title: 'Packing charges', type: 'packing', amount: 10 },
                { title: 'Convenience fee', type: 'misc', amount: 0 },
            ],
        });

        expect(rows).toEqual([{ label: 'Packing charges', amount: 10 }]);
    });

    it('falls back from title to type, then to a generic label', () => {
        const rows = getOtherChargeRows({
            otherCharges: [
                { type: 'tax', amount: 5 },
                { amount: 7 },
            ],
        });

        expect(rows).toEqual([
            { label: 'tax', amount: 5 },
            { label: 'Other charges', amount: 7 },
        ]);
    });

    it('keeps negative discount rows', () => {
        const rows = getOtherChargeRows({
            otherCharges: [{ title: 'Discount', type: 'discount', amount: -15 }],
        });

        expect(rows).toEqual([{ label: 'Discount', amount: -15 }]);
    });

    it('handles a quote with no other charges', () => {
        const quote = { total: 80, deliveryCharge: 30, otherCharges: [] };

        expect(getItemsTotal(quote)).toBe(50);
        expect(getOtherChargeRows(quote)).toEqual([]);
    });

    it('returns the fallback when there is no quote', () => {
        expect(getItemsTotal(null, 42)).toBe(42);
        expect(getItemsTotal(undefined, 42)).toBe(42);
        expect(getOtherChargeRows(null)).toEqual([]);
        expect(getOtherChargeRows(undefined)).toEqual([]);
    });

    it('treats a zero total as a real quote, not a missing one', () => {
        expect(getItemsTotal({ total: 0 }, 42)).toBe(0);
    });
});

describe('getValidatedSummary', () => {
    it('uses seller delivery of ₹50 for shipping and quote.total as the amount', () => {
        const groups = [
            {
                status: 'validated',
                quote: { total: 250, deliveryCharge: 50, otherCharges: [] },
            },
        ];

        const summary = getValidatedSummary(groups);

        expect(summary.shipping).toBe(50);
        expect(summary.itemsTotal).toBe(200);
        expect(summary.otherCharges).toEqual([]);
        expect(summary.total).toBe(250);
    });

    it('prefers validatedTotal when the backend already summed the quotes', () => {
        const groups = [
            {
                status: 'validated',
                quote: { total: 250, deliveryCharge: 50, otherCharges: [] },
            },
        ];

        expect(getValidatedSummary(groups, 250).total).toBe(250);
        expect(getValidatedSummary(groups, 250).shipping).toBe(50);
    });

    it('sums delivery and other charges across validated sellers only', () => {
        const groups = [
            {
                status: 'validated',
                quote: {
                    total: 160,
                    deliveryCharge: 50,
                    otherCharges: [{ title: 'Packing charges', type: 'packing', amount: 10 }],
                },
            },
            {
                status: 'failed',
                quote: { total: 99, deliveryCharge: 15, otherCharges: [] },
            },
            {
                status: 'validated',
                quote: { total: 80, deliveryCharge: 30, otherCharges: [] },
            },
        ];

        const summary = getValidatedSummary(groups, 240);

        expect(summary.shipping).toBe(80);
        expect(summary.itemsTotal).toBe(150);
        expect(summary.otherCharges).toEqual([{ label: 'Packing charges', amount: 10 }]);
        expect(summary.total).toBe(240);
    });

    it('returns zeros when there are no validated quotes', () => {
        expect(getValidatedSummary(undefined)).toEqual({
            itemsTotal: 0,
            shipping: 0,
            otherCharges: [],
            total: 0,
        });
        expect(getValidatedSummary([{ status: 'failed', quote: { total: 10, deliveryCharge: 5 } }]))
            .toEqual({
                itemsTotal: 0,
                shipping: 0,
                otherCharges: [],
                total: 0,
            });
    });
});

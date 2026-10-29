import { describe, expect, it } from 'vitest';

import {
    formatAmountBoundError,
    formatNumberWithLocalString,
    parseAmount,
    roundMoney,
} from '../priceFormat';

describe('parseAmount', () => {
    it('parses bare numeric strings', () => {
        expect(parseAmount('50.00')).toBe(50);
        expect(parseAmount('0')).toBe(0);
    });

    // Some ONDC sellers send price.value already decorated; plain Number() gives
    // NaN on those, which rendered as "₹NaN" / silently collapsed to 0.
    it('strips currency decoration', () => {
        expect(parseAmount('₹50.00')).toBe(50);
        expect(parseAmount('₹ 50')).toBe(50);
        expect(parseAmount('50.00 INR')).toBe(50);
        expect(parseAmount('1,234.50')).toBe(1234.5);
    });

    it('reads "Rs.50" as 50, not 0.5', () => {
        expect(parseAmount('Rs. 50')).toBe(50);
        expect(parseAmount('Rs.50')).toBe(50);
    });

    it('keeps negatives even when a symbol splits the sign from the digits', () => {
        expect(parseAmount('-15.00')).toBe(-15);
        expect(parseAmount('-₹15.00')).toBe(-15);
    });

    it('passes finite numbers through and falls back otherwise', () => {
        expect(parseAmount(50)).toBe(50);
        expect(parseAmount(-15.5)).toBe(-15.5);
        expect(parseAmount(null)).toBe(0);
        expect(parseAmount(undefined)).toBe(0);
        expect(parseAmount('')).toBe(0);
        expect(parseAmount('abc')).toBe(0);
        expect(parseAmount(NaN)).toBe(0);
        expect(parseAmount('abc', NaN)).toBeNaN();
    });
});

describe('formatNumberWithLocalString', () => {
    it('formats plain numbers with en-IN grouping', () => {
        expect(formatNumberWithLocalString(1234.5)).toBe('1,234.50');
        expect(formatNumberWithLocalString('50')).toBe('50.00');
    });

    // Previously the regex only stripped commas despite the comment, so a
    // symbol-bearing value fell through to the '0' branch — silently wrong.
    it('formats a value that already carries a symbol', () => {
        expect(formatNumberWithLocalString('₹50.00')).toBe('50.00');
        expect(formatNumberWithLocalString('₹1,234.50')).toBe('1,234.50');
    });

    it('still returns 0 for genuinely non-numeric input', () => {
        expect(formatNumberWithLocalString('abc')).toBe('0');
    });
});

describe('roundMoney', () => {
    it('rounds to 2dp', () => {
        expect(roundMoney(1234.567)).toBe(1234.57);
        expect(roundMoney('50.005')).toBe(50.01);
    });

    // Used for the PG total — a NaN here silently broke the amount charged.
    it('handles a symbol-bearing value instead of returning NaN', () => {
        expect(roundMoney('₹50.00')).toBe(50);
    });
});

describe('formatAmountBoundError', () => {
    it('reports an amount below the minimum', () => {
        expect(formatAmountBoundError(50, 100, 100000)).toBe('Amount must be at least ₹100.00');
    });

    it('reports an amount above the maximum', () => {
        expect(formatAmountBoundError(200000, 100, 100000)).toBe('Amount cannot exceed ₹1,00,000.00');
    });

    it('accepts an amount sitting exactly on either bound', () => {
        expect(formatAmountBoundError(100, 100, 100000)).toBe('');
        expect(formatAmountBoundError(100000, 100, 100000)).toBe('');
    });

    it('accepts an in-range amount', () => {
        expect(formatAmountBoundError(500, 100, 100000)).toBe('');
    });

    it('stays silent for an empty, zero, or null amount', () => {
        expect(formatAmountBoundError(0, 100, 100000)).toBe('');
        expect(formatAmountBoundError(null, 100, 100000)).toBe('');
        expect(formatAmountBoundError('', 100, 100000)).toBe('');
    });

    it('stays silent when no bounds are set', () => {
        expect(formatAmountBoundError(500, undefined, undefined)).toBe('');
        expect(formatAmountBoundError(500, null, null)).toBe('');
    });

    it('ignores the side of the bound that is unset', () => {
        expect(formatAmountBoundError(99999999, 100, undefined)).toBe('');
        expect(formatAmountBoundError(50, undefined, 100000)).toBe('');
    });

    it('handles a decorated amount string the way the payment total does', () => {
        expect(formatAmountBoundError('₹50.00', 100, 100000)).toBe('Amount must be at least ₹100.00');
    });
});

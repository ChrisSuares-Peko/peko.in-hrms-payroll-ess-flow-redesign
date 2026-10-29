import { describe, it, expect } from 'vitest';

import {
    numberToIndianWords,
    amountToWords,
    parseSalaryAmount,
    formatText,
    formatLabel,
    formatDocName,
} from '../../../utils/employeeDetails/utils';

describe('numberToIndianWords', () => {
    it('returns "Zero" for 0', () => {
        expect(numberToIndianWords(0)).toBe('Zero');
    });

    it('converts numbers under 1,000 without any grouping word', () => {
        expect(numberToIndianWords(1)).toBe('One');
        expect(numberToIndianWords(19)).toBe('Nineteen');
        expect(numberToIndianWords(42)).toBe('Forty Two');
        expect(numberToIndianWords(100)).toBe('One Hundred');
        expect(numberToIndianWords(999)).toBe('Nine Hundred Ninety Nine');
    });

    it('uses Indian thousand grouping, not Western', () => {
        expect(numberToIndianWords(1800)).toBe('One Thousand Eight Hundred');
        expect(numberToIndianWords(22000)).toBe('Twenty Two Thousand');
    });

    it('uses Lakh grouping for values >= 1,00,000 — the core Indian-vs-Western divergence', () => {
        expect(numberToIndianWords(100000)).toBe('One Lakh');
        // The originally-reported bug: 264000 must read as "Two Lakh Sixty Four Thousand",
        // not the Western "Two Hundred Sixty-Four Thousand".
        expect(numberToIndianWords(264000)).toBe('Two Lakh Sixty Four Thousand');
    });

    it('uses Crore grouping for values >= 1,00,00,000', () => {
        expect(numberToIndianWords(10000000)).toBe('One Crore');
        expect(numberToIndianWords(12345678)).toBe(
            'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight'
        );
    });

    it('floors decimal input and ignores sign', () => {
        expect(numberToIndianWords(1800.99)).toBe('One Thousand Eight Hundred');
        expect(numberToIndianWords(-500)).toBe('Five Hundred');
    });
});

describe('amountToWords', () => {
    it('returns "Zero" for 0, undefined, or a non-numeric string', () => {
        expect(amountToWords(0)).toBe('Zero');
        expect(amountToWords(undefined)).toBe('Zero');
        expect(amountToWords('not-a-number')).toBe('Zero');
    });

    it('renders a whole-rupee amount as "<Words> Rupees" in sentence case', () => {
        expect(amountToWords(1800)).toBe('One thousand eight hundred Rupees');
        expect(amountToWords(264000)).toBe('Two lakh sixty four thousand Rupees');
    });

    it('accepts a comma-formatted string amount the same way as a number', () => {
        expect(amountToWords('2,64,000')).toBe(amountToWords(264000));
    });

    it('includes paise when the amount has a fractional part', () => {
        expect(amountToWords(1800.5)).toBe('One thousand eight hundred Rupees and Fifty Paise');
    });

    it('rounds a fractional part of exactly 1.00 rupee up into the integer part', () => {
        // 999.999 -> paise rounds to 100 -> carries over to 1000 rupees, 0 paise.
        expect(amountToWords(999.999)).toBe(amountToWords(1000));
    });
});

describe('parseSalaryAmount', () => {
    it('passes a finite number through unchanged', () => {
        expect(parseSalaryAmount(20000)).toBe(20000);
    });

    it('strips currency symbols and commas from a formatted string', () => {
        expect(parseSalaryAmount('₹ 20,000.00')).toBe(20000);
    });

    it('returns 0 for undefined or a non-numeric value', () => {
        expect(parseSalaryAmount(undefined)).toBe(0);
        expect(parseSalaryAmount('abc')).toBe(0);
    });
});

describe('formatText', () => {
    it('replaces underscores with spaces and title-cases each word', () => {
        expect(formatText('UNDER_REVIEW')).toBe('Under Review');
        expect(formatText('active')).toBe('Active');
    });

    it('returns an empty string for falsy input', () => {
        expect(formatText(undefined)).toBe('');
        expect(formatText('')).toBe('');
    });
});

describe('formatLabel', () => {
    it('title-cases the first letter and lowercases the rest', () => {
        expect(formatLabel('ACTIVE')).toBe('Active');
    });

    it('falls back to "Exit" for falsy input', () => {
        expect(formatLabel(undefined)).toBe('Exit');
    });
});

describe('formatDocName', () => {
    it('splits camelCase into space-separated, title-cased words', () => {
        expect(formatDocName('bankStatement')).toBe('Bank Statement');
    });
});

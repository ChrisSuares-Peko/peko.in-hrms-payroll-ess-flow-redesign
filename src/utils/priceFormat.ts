/**
 * Number out of a possibly-decorated amount — "₹50.00", "Rs. 50", "1,234.50".
 * Plain `Number()` yields NaN on those, which downstream renders as "₹NaN" or
 * silently collapses to 0. Mirrors parseOndcAmount in purchase/utils/ondc_helper.js.
 *
 * Currency tokens are removed BEFORE the number is matched, because the dot in
 * "Rs." otherwise reads as a decimal point — "Rs.50" would parse as 0.5, wrong
 * by 100×. The sign is captured separately so "-₹15.00", where the symbol sits
 * between the minus and the digits, keeps its sign (discount rows are negative).
 * Returns `fallback` for anything unparseable.
 */
export const parseAmount = (value: unknown, fallback = 0): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    if (value == null) return fallback;
    const raw = String(value).replace(/,/g, '').trim();
    const negative = raw.startsWith('-');
    const match = raw.replace(/(?:₹|rs\.?|inr)/gi, '').match(/\d*\.?\d+/);
    const parsed = match ? parseFloat(match[0]) : NaN;
    if (!Number.isFinite(parsed)) return fallback;
    return negative ? -Math.abs(parsed) : parsed;
};

/** Matches paymentGateway validateAmount `normalizeAmount` — use before surcharge + PG totals. */
export const roundMoney = (val: number | string): number =>
    Math.round((parseAmount(val) + Number.EPSILON) * 100) / 100;

export const amountBeforeCommission = (
    amount?: number | string | null,
    totalCommission?: number | string | null
): number => roundMoney(Number(amount ?? 0) - Number(totalCommission ?? 0));

export const formatNumberWithLocalString = (
    amount: any,
    minFraction: number = 2,
    maxFraction: number = 2
): string => {
    try {
        if (minFraction > maxFraction) maxFraction = minFraction;

        // Strips commas AND currency decoration — this used to remove commas only,
        // despite the comment, so "₹50.00" fell through to the '0' branch below.
        const number = parseAmount(amount, NaN);

        // Check if the conversion resulted in NaN
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(number)) {
            return '0'; // Return '0' if the amount is not a valid number
        }

        // Format the number with Indian locale
        return number.toLocaleString('en-IN', {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction,
        });
    } catch (error) {
        console.log('Error occurred while formatting amount:', error);
        return amount; // Return the original amount if an error occurs
    }
};

export const formatNumberWithoutCommas = (
    amount: any,
    minFraction: number = 2,
    maxFraction: number = 2
): string => {
    try {
        if (minFraction > maxFraction) maxFraction = minFraction;

        // Remove commas and other non-numeric characters (except for decimal points)
        const sanitizedAmount = String(amount).replace(/,/g, '');

        // Convert sanitized amount to a number
        const number = Number(sanitizedAmount);
        // Check if the conversion resulted in NaN
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(number)) {
            // console.log('Invalid number:', sanitizedAmount);
            return amount; // Return the original amount if the conversion fails
        }
        // Format the number without grouping (no commas)
        return number.toLocaleString('en-IN', {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction,
            useGrouping: false, // Disable grouping
        });
    } catch (error) {
        console.log('Error occurred while formatting amount:', error);
        return amount; // Return the original amount if an error occurs
    }
};

export const formatAmountBoundError = (
    amount: number | string | null,
    min?: number | null,
    max?: number | null
): string => {
    const value = roundMoney(amount ?? 0);
    if (!value) return '';
    if (min && value < roundMoney(min)) {
        return `Amount must be at least ₹${formatNumberWithLocalString(min)}`;
    }
    if (max && value > roundMoney(max)) {
        return `Amount cannot exceed ₹${formatNumberWithLocalString(max)}`;
    }
    return '';
};

export const formatNumberWithLocalStringWithoutDecimalPoint = (
    amount: any,
    minFraction: number = 2,
    maxFraction: number = 2
): string => {
    try {
        if (minFraction > maxFraction) maxFraction = minFraction;

        // Remove commas and other non-numeric characters (except for decimal points)
        const sanitizedAmount = String(amount).replace(/,/g, '');

        // Convert sanitized amount to a number
        const number = Number(sanitizedAmount);
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(number)) {
            return amount; // Return original amount if it's not a valid number
        }

        // Determine if the number has any fractional part
        const hasFractionalPart = number % 1 !== 0;

        return number.toLocaleString('en-IN', {
            minimumFractionDigits: hasFractionalPart ? minFraction : 0,
            maximumFractionDigits: hasFractionalPart ? maxFraction : 0,
        });
    } catch (error) {
        console.log('Error occurred while formatting amount:', error);
        return amount;
    }
};

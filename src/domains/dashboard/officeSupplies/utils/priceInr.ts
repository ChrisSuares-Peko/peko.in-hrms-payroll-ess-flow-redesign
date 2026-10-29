import { parseAmount } from '@utils/priceFormat';

/** Non-breaking space so "₹" and the digits cannot wrap onto separate lines. */
const INR_GAP = '\u00A0';

/**
 * "₹ 1,234.50" — en-IN grouping, always 2 decimals (Office Supplies is INR-only).
 *
 * The gap after the symbol matches how money is written everywhere else in the app
 * (the payments summary, the admin orders table, the legacy ecommerce order details).
 * It is a non-breaking space so a squeezed checkout row cannot put ₹ on one line
 * and the amount on the next.
 *
 * Goes through parseAmount so a value that already carries a symbol (some ONDC
 * sellers send "₹50.00") renders as ₹ 50.00 rather than the "₹NaN" a plain
 * Number() produced. The symbol is added here and only here.
 */
export const formatInr = (value?: number | string | null): string =>
    `₹${INR_GAP}${parseAmount(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

/**
 * Discount percentage for a "N% OFF" badge, to 2 decimal places.
 *
 * Deliberately floors rather than rounds. Sellers list inflated `maxPrice`
 * values (a ₹940 item carrying a ₹8,95,48,990 list price is real catalogue
 * data), which puts the true discount at 99.9989% — and both Math.round and
 * toFixed(2) turn that into 100, advertising a paid item as free.
 *
 * Flooring means the badge can only read 100 when price is genuinely 0, and
 * otherwise understates by at most 0.01% — the safe direction for a discount
 * claim. Returns 0 when there is no real discount, so callers can hide the badge.
 */
export const discountPercent = (
    price?: number | string | null,
    listPrice?: number | string | null
): number => {
    const paid = parseAmount(price);
    const listed = parseAmount(listPrice);
    if (!(listed > paid) || listed <= 0) return 0;
    return Math.floor(((listed - paid) / listed) * 10000) / 100;
};

/** "99.99" — the badge label for `discountPercent`, always 2 decimals. */
export const formatDiscountPercent = (
    price?: number | string | null,
    listPrice?: number | string | null
): string => discountPercent(price, listPrice).toFixed(2);

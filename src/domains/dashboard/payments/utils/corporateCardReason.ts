import { formatNumberWithLocalString } from '@utils/priceFormat';

import { CorporateCardPaymentOption } from '../types';

// Why the card cannot pay this bill, in the cardholder's words. Mirrors the checks corporateCard runs before
// a redeem, so the option never offers a payment the authorisation would decline anyway. Empty = can pay.
export const corporateCardBlockingReason = (
    option: CorporateCardPaymentOption,
    totalAmount: number
): string => {
    if (!option.available) {
        return option.reason || 'Your corporate card cannot be used for this payment.';
    }
    const { card } = option;
    if (!card) return 'No active corporate card on this account.';
    if (card.perTxnLimit !== null && totalAmount > card.perTxnLimit) {
        return `This payment exceeds your card's per-transaction limit of ₹ ${formatNumberWithLocalString(card.perTxnLimit)}.`;
    }
    if (card.remaining !== null && totalAmount > card.remaining) {
        return `Only ₹ ${formatNumberWithLocalString(card.remaining)} of your card limit is left for this period.`;
    }
    if (totalAmount > card.walletBalance) {
        return 'Insufficient balance on the corporate card account.';
    }
    // Partner limits, same rule as the wallet and gateway tiles: 0 means no limit.
    const exceeds = (limit?: number | null, current = 0) => !!limit && current + totalAmount > limit;
    if (exceeds(option.limits?.limitPerTransaction)) {
        return 'Your corporate card transaction limit has been exceeded.';
    }
    if (exceeds(option.limits?.limitPerDay, option.usage?.today)) {
        return 'Your daily corporate card transaction limit has been exceeded.';
    }
    if (exceeds(option.limits?.limitPerMonth, option.usage?.month)) {
        return 'Your monthly corporate card transaction limit has been exceeded.';
    }
    return '';
};

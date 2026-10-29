import { formatInr } from './priceInr';
import { CheckoutRefund, ConfirmedSellerGroup } from '../types/cartTypes';

/**
 * What to tell the buyer about the refund of the sellers that could not be placed.
 *
 * Only ever states what the backend reports — the old copy promised "Your payment
 * is being refunded" on every failure while nothing refunded it. Returns '' when
 * there is nothing to say (nothing owed back, or the checkout is still running).
 */
export const refundMessage = (refund?: CheckoutRefund | null): string => {
    if (!refund || !(refund.amount > 0)) return '';
    const amount = formatInr(refund.amount);
    switch (refund.status) {
        case 'PENDING':
        case 'INITIATED':
            return `${amount} is being refunded to your original payment method.`;
        case 'SUCCESS':
            return `${amount} has been refunded to your original payment method.`;
        case 'FAILED':
            return `We couldn't start the refund of ${amount} automatically — our team has been notified and will process it.`;
        default:
            return '';
    }
};

/**
 * Failure copy for a response that carries no refund at all (an older backend, or a
 * capture whose amount could not be read). Promises nothing the backend has not done.
 */
export const REFUND_FALLBACK_MESSAGE =
    "Any amount charged for it will be refunded — if you don't see it, contact support with the payment reference below.";

/** Short refund state for the Order Placed details table. */
export const refundStatusLabel = (refund?: CheckoutRefund | null): string => {
    switch (refund?.status) {
        case 'PENDING':
        case 'INITIATED':
            return 'Refund initiated';
        case 'SUCCESS':
            return 'Refunded';
        case 'FAILED':
            return 'Being processed by our team';
        default:
            return '';
    }
};

/** One seller's placement state, as the placing-order page lists it. */
export const sellerStatusLabel = (status: ConfirmedSellerGroup['status']): string => {
    switch (status) {
        case 'confirmed':
            return 'Confirmed';
        case 'failed':
            return "Couldn't be placed";
        default:
            return 'Waiting for seller…';
    }
};

/** Comma-joined vendor names of the seller groups that failed to confirm. */
export const failedSellerNames = (
    groups: Pick<ConfirmedSellerGroup, 'status' | 'vendorName' | 'bppId'>[] = []
): string =>
    groups
        .filter(group => group.status === 'failed')
        .map(group => group.vendorName || group.bppId || 'seller')
        .join(', ');

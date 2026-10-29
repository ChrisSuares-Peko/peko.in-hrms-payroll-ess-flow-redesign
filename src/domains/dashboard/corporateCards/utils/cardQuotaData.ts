import { formatRupeesDecimal } from './helpers';
import { CardQuota } from '../api/user/cardQuotaApi';

export type CardQuotaState = 'unknown' | 'available' | 'purchase-required' | 'unavailable';

export type CardQuotaAudience = 'admin' | 'cardholder';

export const CARD_QUOTA_COPY = {
    label: 'Physical cards on your plan',
    unavailable: 'Card allowance unavailable',
    noneIncluded: 'None included',
};

/**
 * Fails open on the transport, closed on the value.
 *
 * A null quota means the request failed and must never change what the UI offers — the server refuses on
 * its own and says why. A present allowance is a fact the server stated, so it does drive the UI.
 */
export const resolveCardQuotaState = (quota: CardQuota | null | undefined): CardQuotaState => {
    if (!quota) return 'unknown';
    if (!quota.requiresPayment) return 'available';
    return quota.purchasable ? 'purchase-required' : 'unavailable';
};

/** True when ordering a physical card will cost money rather than being refused outright. */
export const isPhysicalCardPurchase = (quota: CardQuota | null | undefined): boolean =>
    resolveCardQuotaState(quota) === 'purchase-required';

/**
 * Why a physical card cannot simply be ordered for free. Null when it can — a card that is for sale is
 * not blocked, so this never returns a reason for the purchase case.
 */
export const physicalCardBlockReason = (
    quota: CardQuota | null | undefined,
    audience: CardQuotaAudience = 'admin'
): string | null => {
    if (resolveCardQuotaState(quota) !== 'unavailable') return null;
    return audience === 'admin'
        ? 'Your plan has no physical cards left, and extra cards are not available on it. Upgrade your plan to order more.'
        : "Your company's plan has no physical cards left. Ask your admin to upgrade the plan.";
};

/** The price prompt shown before an admin pays for an extra card. */
export const physicalCardPriceNote = (
    quota: CardQuota | null | undefined,
    audience: CardQuotaAudience = 'admin'
): string | null => {
    if (!isPhysicalCardPurchase(quota) || !quota) return null;
    const price = formatRupeesDecimal(quota.unitPrice);
    if (audience === 'cardholder') {
        return `Your company's plan has no free physical cards left. Your admin will be asked to pay ${price} + GST to approve this.`;
    }
    return quota.included > 0
        ? `You've used all ${quota.included} physical card${quota.included === 1 ? '' : 's'} included in your plan. This one costs ${price} + GST.`
        : `Your plan doesn't include a complimentary physical card. A fee of ${price} + GST applies.`;
};

export const cardQuotaSummary = (quota: CardQuota | null | undefined): string => {
    if (!quota) return CARD_QUOTA_COPY.unavailable;
    if (quota.allowed <= 0) return CARD_QUOTA_COPY.noneIncluded;
    return `${quota.used} of ${quota.allowed} used`;
};

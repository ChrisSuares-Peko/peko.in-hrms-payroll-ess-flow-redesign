import { describe, expect, it } from 'vitest';

import {
    cardQuotaSummary,
    isPhysicalCardPurchase,
    physicalCardBlockReason,
    physicalCardPriceNote,
    resolveCardQuotaState,
} from '../../utils/cardQuotaData';

const quota = (over = {}) => ({
    used: 0,
    included: 1,
    purchased: 0,
    allowed: 1,
    remaining: 1,
    requiresPayment: false,
    unitPrice: 19,
    purchasable: true,
    ...over,
});

const exhausted = (over = {}) => quota({ used: 1, remaining: 0, requiresPayment: true, ...over });

describe('resolveCardQuotaState', () => {
    it('is available while the plan still includes a card', () => {
        expect(resolveCardQuotaState(quota())).toBe('available');
    });

    it('asks for payment once the included cards are used', () => {
        expect(resolveCardQuotaState(exhausted())).toBe('purchase-required');
    });

    /**
     * The transport failing and the plan being used up are opposite situations: one must not change what
     * the UI offers, the other must.
     */
    it.each([[null], [undefined]])('is unknown when the quota could not be read (%s)', value => {
        expect(resolveCardQuotaState(value)).toBe('unknown');
    });

    // A plan with no free card is the paywall, not a wall — this is the whole point of the change.
    it('treats a plan with no included cards as purchasable, not blocked', () => {
        expect(
            resolveCardQuotaState(
                quota({ included: 0, allowed: 0, remaining: 0, requiresPayment: true })
            )
        ).toBe('purchase-required');
    });

    it('is unavailable only when the plan carries no price', () => {
        expect(resolveCardQuotaState(exhausted({ purchasable: false, unitPrice: 0 }))).toBe(
            'unavailable'
        );
    });

    it('counts purchased cards as available again', () => {
        expect(
            resolveCardQuotaState(quota({ used: 1, purchased: 1, allowed: 2, remaining: 1 }))
        ).toBe('available');
    });
});

describe('isPhysicalCardPurchase', () => {
    it('is false when a card is still free', () => {
        expect(isPhysicalCardPurchase(quota())).toBe(false);
    });

    it('is true when the next card must be bought', () => {
        expect(isPhysicalCardPurchase(exhausted())).toBe(true);
    });

    // Fail open on the transport: an unreadable quota must never start a payment.
    it('is false when the quota is unknown', () => {
        expect(isPhysicalCardPurchase(null)).toBe(false);
    });
});

describe('physicalCardBlockReason', () => {
    it('blocks nothing while cards remain', () => {
        expect(physicalCardBlockReason(quota())).toBeNull();
    });

    // A purchasable card is not blocked — it is for sale.
    it('blocks nothing when the card can be bought', () => {
        expect(physicalCardBlockReason(exhausted())).toBeNull();
    });

    it('blocks nothing when the quota is unknown', () => {
        expect(physicalCardBlockReason(null)).toBeNull();
    });

    it('blocks only when the plan sells no extra cards', () => {
        expect(physicalCardBlockReason(exhausted({ purchasable: false, unitPrice: 0 }))).toContain(
            'Upgrade your plan'
        );
    });

    it('tells a cardholder to ask their admin rather than to upgrade', () => {
        const reason = physicalCardBlockReason(
            exhausted({ purchasable: false, unitPrice: 0 }),
            'cardholder'
        );

        expect(reason).toContain('admin');
        expect(reason).not.toMatch(/upgrade your plan/i);
    });
});

describe('physicalCardPriceNote', () => {
    it('quotes the price once the included cards are used', () => {
        expect(physicalCardPriceNote(exhausted())).toContain('₹19.00');
    });

    it.each([['admin'], ['cardholder']] as const)('tells %s GST is added on top of the price', audience => {
        expect(physicalCardPriceNote(exhausted(), audience)).toContain('₹19.00 + GST');
    });

    it('says the plan includes none when it includes none', () => {
        const note = physicalCardPriceNote(
            quota({ included: 0, allowed: 0, remaining: 0, requiresPayment: true })
        );

        expect(note).toContain("doesn't include a complimentary physical card");
        expect(note).toContain('₹19.00');
    });

    it('is silent while a card is still free', () => {
        expect(physicalCardPriceNote(quota())).toBeNull();
    });

    it('is silent when the quota is unknown', () => {
        expect(physicalCardPriceNote(null)).toBeNull();
    });

    // The cardholder is not the payer, so the prompt must name the admin instead of asking them to pay.
    it('tells a cardholder their admin will be asked to pay', () => {
        const note = physicalCardPriceNote(exhausted(), 'cardholder');

        expect(note).toContain('admin');
        expect(note).toContain('₹19.00');
    });
});

describe('cardQuotaSummary', () => {
    it('reads as used of allowed', () => {
        expect(cardQuotaSummary(quota({ used: 1, purchased: 1, allowed: 2 }))).toBe('1 of 2 used');
    });

    it('says the allowance is unavailable rather than inventing 0 of 0', () => {
        expect(cardQuotaSummary(null)).toBe('Card allowance unavailable');
        expect(cardQuotaSummary(null)).not.toContain('0 of 0');
    });

    it('names a plan that includes none', () => {
        expect(cardQuotaSummary(quota({ included: 0, allowed: 0 }))).toBe('None included');
    });
});

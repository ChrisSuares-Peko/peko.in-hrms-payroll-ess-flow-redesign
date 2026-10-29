import { describe, expect, it } from 'vitest';

import { CartItem } from '../../types/cartTypes';
import {
    fromFailedGroups,
    fromStockItems,
    reasonLabel,
    STOCK_UNAVAILABLE_REASON,
} from '../../utils/unavailableCartItems';

const listed = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 1,
    ondcProductId: 'SKU-1',
    vendorName: 'Office Mart',
    productName: 'A4 paper',
    image: 'paper.png',
    price: 50,
    maxPrice: 60,
    productQuantity: 2,
    availableQuantity: 10,
    totalPrice: 100,
    available: true,
    ...overrides,
});

describe('reasonLabel', () => {
    it('maps stock-adjacent seller reasons to the buyer-facing copy', () => {
        expect(reasonLabel('not_serviceable')).toBe(
            'The seller cannot deliver this to your pincode.'
        );
        expect(reasonLabel('quote_unpriced')).toBe(
            'The seller did not return a price for this item, so it cannot be checked out.'
        );
        expect(reasonLabel('missing_seller_data')).toBe(
            'Seller details are missing for this item, so it cannot be checked out.'
        );
    });

    it('prefers the seller message for nack and error, then a generic confirm failure', () => {
        expect(reasonLabel('nack', 'Pincode not serviceable')).toBe('Pincode not serviceable');
        expect(reasonLabel('error', { message: 'Quote expired' })).toBe('Quote expired');
        expect(reasonLabel('nack')).toBe('The seller could not confirm this item.');
        expect(reasonLabel('error')).toBe('The seller could not confirm this item.');
    });

    it('falls back to a generic cannot-be-ordered line for unknown reasons', () => {
        expect(reasonLabel('timeout')).toBe(
            'The seller could not confirm this item, so it cannot be ordered.'
        );
        expect(reasonLabel(null, { ondcMessage: 'Seller NACK' })).toBe('Seller NACK');
    });
});

describe('fromStockItems', () => {
    it('lists only rows the catalog marked unavailable, with the stock reason', () => {
        const rows = fromStockItems([
            listed(),
            listed({
                productId: 2,
                ondcProductId: 'SKU-2',
                productName: 'Stapler',
                available: false,
            }),
        ]);

        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            productId: 2,
            ondcProductId: 'SKU-2',
            productName: 'Stapler',
            vendorName: 'Office Mart',
            reason: STOCK_UNAVAILABLE_REASON,
            stockUnavailable: true,
        });
    });
});

describe('fromFailedGroups', () => {
    it('builds one row per failed-group cart item and copies image from the cart', () => {
        const rows = fromFailedGroups(
            [
                {
                    status: 'validated',
                    reason: null,
                    error: null,
                    vendorName: 'Office Mart',
                    cartItems: [
                        {
                            productId: 1,
                            ondcProductId: 'SKU-1',
                            productName: 'A4 paper',
                            productQuantity: 2,
                        },
                    ],
                },
                {
                    status: 'failed',
                    reason: 'not_serviceable',
                    error: null,
                    vendorName: 'Other Seller',
                    cartItems: [
                        {
                            productId: 9,
                            ondcProductId: 'SKU-9',
                            productName: 'Stapler',
                            productQuantity: 1,
                        },
                    ],
                },
            ],
            [
                listed(),
                listed({
                    productId: 9,
                    ondcProductId: 'SKU-9',
                    productName: 'Stapler',
                    image: 'stapler.png',
                    vendorName: 'Other Seller',
                }),
            ]
        );

        expect(rows).toEqual([
            {
                productId: 9,
                ondcProductId: 'SKU-9',
                productName: 'Stapler',
                image: 'stapler.png',
                vendorName: 'Other Seller',
                reason: 'The seller cannot deliver this to your pincode.',
                stockUnavailable: false,
            },
        ]);
    });

    it('falls back to cart items of the same seller when the group lists none', () => {
        const rows = fromFailedGroups(
            [
                {
                    status: 'failed',
                    reason: 'quote_unpriced',
                    error: null,
                    vendorName: 'Office Mart',
                    cartItems: [],
                },
            ],
            [listed()]
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].productName).toBe('A4 paper');
        expect(rows[0].productId).toBe(1);
        expect(rows[0].reason).toContain('did not return a price');
    });

    it('does not list another seller’s cart items when the failed group has no rows', () => {
        const rows = fromFailedGroups(
            [
                {
                    status: 'failed',
                    reason: 'nack',
                    error: null,
                    vendorName: 'Other Seller',
                    cartItems: [],
                },
            ],
            [listed()]
        );

        expect(rows).toEqual([]);
    });

    it('marks a failed row as stock-unavailable when the cart listing is already gone', () => {
        const rows = fromFailedGroups(
            [
                {
                    status: 'failed',
                    reason: 'nack',
                    error: null,
                    vendorName: 'Office Mart',
                    cartItems: [
                        {
                            productId: 1,
                            ondcProductId: 'SKU-1',
                            productName: 'A4 paper',
                            productQuantity: 2,
                        },
                    ],
                },
            ],
            [listed({ available: false })]
        );

        expect(rows[0].stockUnavailable).toBe(true);
    });
});

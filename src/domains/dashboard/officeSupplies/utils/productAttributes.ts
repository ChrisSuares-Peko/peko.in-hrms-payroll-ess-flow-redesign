import {
    getBrand as getBrandFromTags,
    getCountryOfOrigin as getCountryFromTags,
    getHsn as getHsnFromTags,
    getNetQuantity as getNetQty,
    readTag,
} from '@utils/ondcProductAttributes';

import { OndcProduct, OndcTag } from '../types/products';

export type { OndcTag };

/** Look up a value inside the ONDC `tags` array by group code + item code. */
export { readTag };

export const getBrand = (product: OndcProduct): string => getBrandFromTags(product);

export const getCountryOfOrigin = (product: OndcProduct): string => getCountryFromTags(product);

export const getNetQuantity = (product: OndcProduct): string => getNetQty(product);

/** HSN code from ONDC tags when the seller provides it (common tag codes vary). */
export const getHsn = (product: OndcProduct): string => getHsnFromTags(product);

/**
 * Format an ONDC ISO-8601 duration (e.g. "P2D", "PT4H", "PT30M") as human text
 * ("2 days", "4 hours", "30 minutes"). Returns '' for anything unparseable.
 */
export const formatIsoDuration = (duration?: string | null): string => {
    if (!duration) return '';
    const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i.exec(duration.trim());
    if (!match) return '';
    const [, days, hours, minutes] = match;
    const parts: string[] = [];
    const push = (count: string | undefined, unit: string) => {
        const n = parseInt(count || '', 10);
        if (n > 0) parts.push(`${n} ${unit}${n === 1 ? '' : 's'}`);
    };
    push(days, 'day');
    push(hours, 'hour');
    push(minutes, 'minute');
    return parts.join(' ');
};

/** Parse "@ondc/org/contact_details_consumer_care" ("name,email,phone"). */
export const parseConsumerCare = (
    raw?: string | null,
): { name: string; email: string; phone: string } | null => {
    if (!raw?.trim()) return null;
    const [name = '', email = '', phone = ''] = raw.split(',').map(s => s.trim());
    if (!name && !email && !phone) return null;
    return { name, email, phone };
};

/**
 * Hard ceiling on how many units of one item a single order may contain.
 *
 * Sellers publish sentinel counts (895689 is real catalogue data), so without an
 * absolute cap the PDP advertises an absurd "Max: N" and the stepper lets the
 * buyer climb to it.
 *
 * Mirrors MAX_ORDER_QUANTITY_PER_ITEM in purchase/utils/ondcQuantityBounds.js —
 * keep the two in sync. The server's copy is authoritative and enforces the
 * limit; this one only bounds the stepper and the label.
 */
export const MAX_ORDER_QUANTITY_PER_ITEM = 10;

/**
 * The quantity fields of a catalogue row or a stored cart item. Spelled out
 * rather than Pick<OndcProduct, …> because CartItem types maxQuantity as
 * optional/nullable while OndcProduct requires it; the body handles both.
 */
type QuantityFields = {
    availableQuantity?: number | null;
    minQuantity?: number | null;
    maxQuantity?: number | null;
};

/**
 * Purchasable quantity bounds from the seller's catalog entry:
 * min = quantity.minimum.count (default 1); max = the smallest of current stock,
 * quantity.maximum.count and MAX_ORDER_QUANTITY_PER_ITEM. `purchasable` is false
 * when stock can't even cover the minimum order quantity.
 *
 * A seller minimum above our cap still wins, otherwise the item would be
 * unbuyable — the same rule the server applies.
 */
export const getQtyBounds = (
    product: QuantityFields,
): { min: number; max: number; purchasable: boolean } => {
    const available = product.availableQuantity || 0;
    const min = Math.max(1, product.minQuantity || 1);
    const max = product.maxQuantity || 0
    return { min, max, purchasable: available >= min && available > 0 };
};

export type Attribute = { label: string; value: string };

/**
 * Build the list of product attributes we actually have data for. GST, HSN,
 * packaging, warranty and model/variant are intentionally omitted (no source).
 */
export const buildKeyAttributes = (product?: OndcProduct | null): Attribute[] => {
    if (!product) return [];
    const rows: Attribute[] = [
        { label: 'Brand', value: getBrand(product) },
        { label: 'Net quantity', value: getNetQuantity(product) },
        { label: 'Country of origin', value: getCountryOfOrigin(product) },
        { label: 'Category', value: product.localCategory || product.categoryId || '' },
    ];
    return rows.filter(r => r.value);
};

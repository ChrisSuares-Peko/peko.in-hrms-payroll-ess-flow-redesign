/**
 * Order-quantity bounds for ONDC (Office Supplies) items.
 *
 * Deliberately dependency-free: this is imported by cart use-cases as well as
 * controllers, and ondc_helper.js pulls in the category taxonomy (and with it a
 * DB connection), which has no business being loaded for a bounds calculation.
 */

/**
 * Hard ceiling on how many units of one item a single order may contain.
 *
 * Sellers publish sentinel counts in `quantity.available.count` /
 * `quantity.maximum.count` (895689 and 99 are both common) and those land in
 * ondcProducts unparsed, so without an absolute cap the storefront advertises —
 * and the API accepts — absurd order quantities.
 *
 * Mirrored on the frontend in officeSupplies/utils/productAttributes.ts
 * (`MAX_ORDER_QUANTITY_PER_ITEM`); keep the two in sync. This one is
 * authoritative — the frontend copy only bounds the stepper and the "Max: N" label.
 */
const MAX_ORDER_QUANTITY_PER_ITEM = 10;

/**
 * Effective order-quantity bounds for an ONDC product row, or a cart snapshot of
 * one. The ceiling is the smallest of live stock, the seller's declared maximum
 * and our own per-item cap.
 *
 * Reads `availableQuantity` / `minQuantity` / `maxQuantity`, so it accepts both
 * an ondcProducts row and a stored cart item.
 *
 * A seller may declare a minimum above our cap. Clamping to the cap would then
 * make the item unbuyable, so `min` wins and `max` is raised back to it — a
 * seller's minimum order quantity is a condition of sale, not a preference.
 */
const ondcQuantityBounds = (row = {}) => {
    const min = parseInt(row.minQuantity) || 1;
    const stock = parseInt(row.availableQuantity) || 0;
    const sellerMax = parseInt(row.maxQuantity) > 0 ? parseInt(row.maxQuantity) : stock;
    const max = Math.min(stock, sellerMax, MAX_ORDER_QUANTITY_PER_ITEM);
    return { min, max: Math.max(min, max) };
};

module.exports = { MAX_ORDER_QUANTITY_PER_ITEM, ondcQuantityBounds };

/**
 * The ONDC buyer-app finder fee, as money.
 *
 * The fee is declared to the seller on /init (services/ondc.js) and, when the
 * deduction is enabled, withheld from that seller's Easy Split allocation — so
 * the seller is paid their quote total less this figure, and it stays in Peko's
 * merchant balance alongside the platform fee.
 *
 * Charged on ITEM VALUE ONLY: the seller's delivery charge and taxes are outside
 * the base. See sumQuoteItemsTotal in utils/ondc_helper.js for how that is
 * derived, and why it can legitimately be unknown.
 *
 * Pure and side-effect free on purpose — this number cannot be corrected once
 * the split is written (Cashfree takes it with `disable_split: true`), so it is
 * the one piece of this feature that must be exhaustively unit-testable.
 */

const round2 = (n) => parseFloat(n.toFixed(2));

/**
 * @param {Object} params
 * @param {number|null} params.itemsTotal item value the fee is charged on
 * @param {string} params.feeType "percent" (of item value) or "amount" (flat)
 * @param {string|number} params.feeAmount the configured percentage or flat value
 * @returns {number} fee in rupees to 2dp; 0 when it cannot be charged
 */
const computeBuyerFinderFee = ({ itemsTotal, feeType, feeAmount } = {}) => {
  const base = Number(itemsTotal);
  // null itemsTotal means the seller's breakup had no item rows — we could not
  // read the base, so we charge nothing rather than guess at one.
  if (itemsTotal === null || itemsTotal === undefined || !Number.isFinite(base) || base <= 0) {
    return 0;
  }

  const configured = Number(feeAmount);
  if (!Number.isFinite(configured) || configured <= 0) return 0;

  // A flat fee is per seller group, matching how it is declared: each seller in
  // a multi-seller cart gets its own /init carrying its own payment block, so a
  // three-seller order withholds the flat fee three times.
  const raw = feeType === "amount" ? configured : (base * configured) / 100;
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  // Never withhold more than the items are worth — a misconfigured 200% or a
  // flat fee larger than the order must not drive the payout negative.
  return round2(Math.min(raw, base));
};

module.exports = { computeBuyerFinderFee };

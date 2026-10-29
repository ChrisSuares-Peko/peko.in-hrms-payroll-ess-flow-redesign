'use strict';

/**
 * When the corporate has an active GROUP plan (e.g. Peko+), addon pricing must come from
 * that plan's cashback row for the service — not from the INDIVIDUAL catalogue row.
 * Uses GROUP tier for unitPrice, baseLimit, and isDynamicUnitPricing when present and numeric.
 *
 * @param {Array} allCashbacks — rows from findOneServiceCashbacks (nested package + serviceOperator)
 * @param {object|null} groupSub — result of findExistingGroupPackage (must include package.id)
 * @param {object} individualCashback — cashback row for packageType INDIVIDUAL (subscription packageId)
 * @returns {object|null}
 */
function resolveAddonTierPricing(allCashbacks, groupSub, individualCashback) {
  if (!individualCashback) return null;

  const groupPackageId = groupSub?.package?.id;
  let tierRow = individualCashback;

  if (groupPackageId != null && Array.isArray(allCashbacks)) {
    const groupCashback = allCashbacks.find(
      (row) =>
        row.package?.packageType === "GROUP" &&
        Number(row.packageId) === Number(groupPackageId)
    );
    if (groupCashback && groupCashback.unitPrice != null && groupCashback.unitPrice !== "") {
      const n = parseFloat(groupCashback.unitPrice);
      if (!Number.isNaN(n) && n > 0) {
        tierRow = groupCashback;
      }
    }
  }

  const unitPrice = parseFloat(tierRow.unitPrice);
  const baseLimit =
    tierRow.baseLimit != null && tierRow.baseLimit !== ""
      ? parseFloat(tierRow.baseLimit)
      : null;
  const isDynamicUnitPricing = !!tierRow.serviceOperator?.isDynamicUnitPricing;

  return {
    tierRow,
    unitPrice,
    baseLimit,
    isDynamicUnitPricing,
    packageIdForSubscription: individualCashback.packageId,
  };
}

module.exports = { resolveAddonTierPricing };

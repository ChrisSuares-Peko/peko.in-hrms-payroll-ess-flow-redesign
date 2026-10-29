'use strict';

/**
 * Is this addon billed monthly on plan renewal?
 * false = one-time wallet purchase (Turbo, e-signing, invoicing) — never in subscription billing.
 * true  = recurring monthly charge (payroll).
 */
function isRecurringAddon(addonData) {
  // isDynamicUnitPricing is a BOOLEAN column, but Sequelize raw/nested reads (findAddonPrice) return it as
  // 1/0 (number), not true/false. A strict `=== true` therefore wrongly drops EVERY recurring addon from the
  // recompute/renewal paths (calculatePlanAmount, calculateSubscriptionPrice, renewAddonSubscriptions) — e.g.
  // a Peko+ + payroll renewal recomputes 2999 instead of 2999 + payroll 600 = 3599. Use a truthy check,
  // matching the scheduler's calculatePlanAmount (`!!serviceOperator?.isDynamicUnitPricing`).
  return !!addonData?.serviceOperator?.isDynamicUnitPricing;
}

/**
 * Addon line total: unit price × quantity.
 * Centralises the parseFloat coercions that were repeated at every call site.
 */
function calculateAddonLineTotal(unitPrice, quantity) {
  return parseFloat(unitPrice) * parseFloat(quantity);
}

/**
 * Pro-rated addon price for the current billing cycle.
 * Applied when daysRemaining ≤ 30 and the addon is recurring (isDynamicUnitPricing=true).
 * Result is rounded up to the nearest paisa (₹0.01).
 */
function calculateProRatedAddonPrice(baseUnitPrice, daysRemaining) {
  const decimalValue = (baseUnitPrice / 30) * daysRemaining;
  return Math.ceil((decimalValue + Number.EPSILON) * 100) / 100;
}

// A recurring addon follows the base plan's billing cycle: on an ANNUAL base it bills for the full year
// (× 12 months), on a MONTHLY base for one month. Callers pass the BASE plan's billingType. Keep this
// rule in sync with the scheduler's inlined copy (triggerSubscriptionCharges.js calculatePlanAmount).
const ANNUAL_ADDON_MONTHS = 12;
function annualizeAddon(monthlyTotal, billingType) {
  return String(billingType || "").toUpperCase() === "ANNUALLY"
    ? monthlyTotal * ANNUAL_ADDON_MONTHS
    : monthlyTotal;
}

module.exports = { isRecurringAddon, calculateAddonLineTotal, calculateProRatedAddonPrice, annualizeAddon };

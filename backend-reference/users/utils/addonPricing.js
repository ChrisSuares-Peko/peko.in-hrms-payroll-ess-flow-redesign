'use strict';

/**
 * Is this addon billed monthly on plan renewal?
 * false = one-time wallet purchase (Turbo, e-signing, invoicing) — never in subscription billing.
 * true  = recurring monthly charge (payroll).
 */
function isRecurringAddon(addonData) {
  return addonData?.serviceOperator?.isDynamicUnitPricing === true;
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

module.exports = { isRecurringAddon, calculateAddonLineTotal, calculateProRatedAddonPrice };

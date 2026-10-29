/**
 * Who to email about an ONDC (office supplies) order.
 *
 * One resolver shared by every ondc*Notify sender, because the old per-service
 * copy keyed on `corporateUserId` ALONE and returned null otherwise — which is
 * exactly the sub-corporate case (`subCorporateUserId` set, `corporateUserId`
 * null; see loadPaymentContext in services/ondcOnConfirmPersist.js). Those
 * buyers were silently getting no cancel, return, refund or invoice mail at all.
 *
 * Three sources, in the order the order row can be trusted:
 *   1. corporateUsers        — the owning corporate account
 *   2. subCorporateUsers     — the sub-user who actually placed it
 *   3. billing.email         — what the buyer typed at checkout, and the address
 *                              the BPP itself holds (services/ondc.js writes it)
 *
 * NOTE: services/ondcCheckoutNotify.js exports a DIFFERENT function also called
 * resolveCorporateRecipient — it takes the PG `paymentData` (credential-based
 * lookup) and runs before any ondcOrders row exists. This one takes a row. The
 * distinct name is deliberate; don't merge them.
 */

const corporateUserEntity = require("../models/entities/corporateUser");
const subCorporateUserEntity = require("../models/entities/subCorporateUsers");

const trimmed = (value) => (typeof value === "string" ? value.trim() : "");

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const candidate = trimmed(value);
    if (candidate) return candidate;
  }
  return "";
};

/**
 * @param {Object} row an ondcOrders row (raw)
 * @returns {Promise<{email: string|null, name: string, corporate: Object|null}>}
 *   email null means "nobody to mail" — callers must skip WITHOUT claiming a
 *   send-once lock, so a later callback can still deliver it.
 */
const resolveOndcOrderRecipient = async (row) => {
  const billing = row && typeof row.billing === "object" && row.billing ? row.billing : {};
  const fallbackName = firstNonEmpty(billing.name);

  if (row?.corporateUserId) {
    const corporate = await corporateUserEntity.findOne({
      where: { id: row.corporateUserId },
      raw: true,
    });
    const email = firstNonEmpty(corporate?.email, billing.email);
    if (email) {
      return {
        email,
        name: firstNonEmpty(corporate?.contactPersonName, corporate?.name, fallbackName) || "there",
        corporate: corporate || null,
      };
    }
  }

  if (row?.subCorporateUserId) {
    const subUser = await subCorporateUserEntity.findOne({
      where: { id: row.subCorporateUserId },
      raw: true,
    });
    const email = firstNonEmpty(subUser?.email, billing.email);
    if (email) {
      return {
        email,
        name: firstNonEmpty(subUser?.name, fallbackName) || "there",
        // No corporate record on this path — callers that want the GSTIN or the
        // company name must tolerate null rather than assume a corporate.
        corporate: null,
      };
    }
  }

  const billingEmail = firstNonEmpty(billing.email);
  if (billingEmail) {
    return { email: billingEmail, name: fallbackName || "there", corporate: null };
  }

  return { email: null, name: "there", corporate: null };
};

module.exports = { resolveOndcOrderRecipient };

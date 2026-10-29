/**
 * Pull the seller's payout account and tax identity out of an ONDC `on_init`
 * order, and decide whether it is good enough to register as a Cashfree Easy
 * Split vendor.
 *
 * Everything here is pure — no DB, no HTTP — so the whole eligibility policy is
 * unit-testable against real BPP payloads.
 *
 * Two ONDC subtleties worth keeping straight:
 *   - `@ondc/org/settlement_details` is an ARRAY; only `[0]` is flattened onto
 *     the seller row, the whole array is kept for audit.
 *   - in the `bpp_terms` tag group, `tax_number` is the GST of the SELLER NP
 *     while `provider_tax_number` is the PAN of the PROVIDER. They are different
 *     entities; don't collapse them.
 */

/**
 * BPP sandboxes routinely echo masked or placeholder values instead of real
 * bank details ("XXXX", "xxxx", and the literal strings from the ONDC spec
 * examples). Settling money to those would be worse than not settling at all.
 */
const isPlaceholder = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return true;
  if (/^x+$/i.test(raw)) return true;
  if (/xxxx/i.test(raw)) return true;
  // ONDC documentation placeholders, e.g. "gst_number_of_sellerNP",
  // "PAN_number_of_provider", "bank_name_of_provider"
  if (/_(?:of|number)_|^(?:gst|pan)_number/i.test(raw)) return true;
  return false;
};

/** Trim to null so empty strings never reach the DB as "". */
const clean = (value) => {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : raw;
};

/**
 * Flatten `message.order.payment` into the seller row's settlement columns.
 * Returns nulls (never throws) when the BPP omitted the block entirely.
 */
const extractSellerSettlement = (order) => {
  const payment = order?.payment || {};
  const details = Array.isArray(payment["@ondc/org/settlement_details"])
    ? payment["@ondc/org/settlement_details"]
    : [];
  const first = details[0] || {};

  return {
    settlementType: clean(first.settlement_type),
    settlementCounterparty: clean(first.settlement_counterparty),
    settlementPhase: clean(first.settlement_phase),
    upiAddress: clean(first.upi_address),
    settlementBankAccountNo: clean(first.settlement_bank_account_no),
    settlementIfscCode: clean(first.settlement_ifsc_code),
    beneficiaryName: clean(first.beneficiary_name),
    bankName: clean(first.bank_name),
    branchName: clean(first.branch_name),
    // full array kept verbatim — reconciliation needs the other phases
    settlementDetails: details.length ? details : null,
    collectedBy: clean(payment.collected_by),
    buyerFinderFeeType: clean(payment["@ondc/org/buyer_app_finder_fee_type"]),
    buyerFinderFeeAmount: clean(payment["@ondc/org/buyer_app_finder_fee_amount"]),
  };
};

/**
 * Read the seller's tax identity out of the `bpp_terms` tag group. Absent in
 * some BPP responses (our outbound /init sends no `bap_terms`, which is what
 * normally elicits it), so every field is optional.
 */
const extractBppTerms = (order) => {
  const tags = Array.isArray(order?.tags) ? order.tags : [];
  const bppTerms = tags.find((tag) => tag?.code === "bpp_terms");
  const list = Array.isArray(bppTerms?.list) ? bppTerms.list : [];
  const valueOf = (code) => clean(list.find((entry) => entry?.code === code)?.value);

  return {
    // GST of the seller network participant
    gstNumber: valueOf("tax_number"),
    // PAN of the provider (the actual merchant behind the seller app)
    panNumber: valueOf("provider_tax_number"),
    bppTerms: list.length ? list : null,
  };
};

const UPI_VPA = /^[\w.-]{2,}@[a-z]{2,}$/i;
const ACCOUNT_NO = /^\d{6,20}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Can this seller be paid through Easy Split? Returns a stable reason slug when
 * not, so the ops digest and the `ondcSellers.ineligibleReason` column stay
 * queryable.
 */
const judgeSplitEligibility = (settlement = {}) => {
  const deny = (ineligibleReason) => ({ splitEligible: false, ineligibleReason });

  if (!settlement.settlementDetails) return deny("no_settlement_details");

  const type = String(settlement.settlementType || "").toLowerCase();

  if (type === "upi") {
    if (isPlaceholder(settlement.upiAddress)) return deny("masked_settlement_details");
    if (!UPI_VPA.test(settlement.upiAddress)) return deny("missing_upi");
    return { splitEligible: true, ineligibleReason: null };
  }

  // neft / rtgs / imps — and anything else the BPP names — settles to a bank account
  const accountNo = settlement.settlementBankAccountNo;
  const ifsc = settlement.settlementIfscCode;

  if (isPlaceholder(accountNo) || isPlaceholder(ifsc)) {
    return deny("masked_settlement_details");
  }
  if (!ACCOUNT_NO.test(accountNo)) return deny("missing_account_no");
  if (!IFSC.test(String(ifsc).toUpperCase())) return deny("missing_ifsc");

  return { splitEligible: true, ineligibleReason: null };
};

/**
 * Everything the `ondcSellers` upsert needs, derived from one on_init order.
 * `seller` carries the identity we already know from the catalog row.
 */
const buildSellerRecord = (order, seller = {}) => {
  const settlement = extractSellerSettlement(order);
  return {
    bppId: clean(seller.bppId),
    bppUri: clean(seller.bppUri),
    providerId: clean(seller.providerId),
    vendorName: clean(seller.vendorName) || clean(seller.providerId),
    domain: clean(seller.domain),
    ...settlement,
    ...extractBppTerms(order),
    ...judgeSplitEligibility(settlement),
  };
};

/**
 * Seller NETWORK PARTICIPANT identity + contact from an on_search catalog's
 * `bpp/descriptor`. This is the seller APP (who we chase when a delivery is late),
 * not the provider/shop — `vendorName` is that.
 *
 * ONDC only mandates `descriptor.name`; contact details are optional and BPPs put
 * them in several shapes, so every known one is probed and anything missing stays
 * null. Nothing here is invented — a null means "we genuinely don't have it", which
 * the TAT-breach alert reports as "not on file" so ops knows to chase it.
 */
const extractSellerNpContact = (catalog) => {
  const descriptor = catalog?.["bpp/descriptor"] || catalog?.bppDescriptor || {};
  // Seen in the wild as `contact`, `support`, or flat on the descriptor itself.
  const contact = descriptor.contact || descriptor.support || descriptor || {};
  const npName = clean(descriptor.name);
  const npContactEmail = clean(contact.email);
  const npContactPhone = clean(contact.phone || contact.phone_number || contact.mobile);

  return {
    npName: npName && !isPlaceholder(npName) ? npName : null,
    npContactEmail: npContactEmail && !isPlaceholder(npContactEmail) ? npContactEmail : null,
    npContactPhone: npContactPhone && !isPlaceholder(npContactPhone) ? npContactPhone : null,
  };
};

module.exports = {
  extractSellerSettlement,
  extractBppTerms,
  judgeSplitEligibility,
  buildSellerRecord,
  extractSellerNpContact,
  isPlaceholder,
};

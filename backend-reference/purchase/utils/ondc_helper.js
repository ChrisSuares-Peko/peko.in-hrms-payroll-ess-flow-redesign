/**
 * Parse an ONDC ISO-8601 duration ("P2D", "PT4H", "P1DT1H") to ms.
 * Null for anything unparseable — callers must treat that as "unknown", never 0.
 * Y/M rejected rather than approximated: that would produce wrong payout dates.
 */
const parseIsoDurationMs = (iso) => {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  // "P"/"PT" alone matches but carries no components.
  if (!m || (!m[1] && !m[2] && !m[3] && !m[4])) return null;
  const [, d = 0, h = 0, mi = 0, sec = 0] = m.map((v) => (v === undefined ? undefined : Number(v)));
  return ((d * 24 + h) * 60 + mi) * 60000 + sec * 1000;
};
exports.parseIsoDurationMs = parseIsoDurationMs;

/** Indian PIN: 6 digits, not starting with 0 — same rule as India Post / the storefront. */
const INDIAN_PIN_RE = /^[1-9]\d{5}$/;

/** Digits-only Indian PIN, or null when the value is not a usable PIN. */
const indianPincode = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return INDIAN_PIN_RE.test(digits) ? digits : null;
};
exports.indianPincode = indianPincode;

/**
 * First usable PIN from saved ecommerce addresses: the default-flagged row, else
 * the first row that carries a valid zipCode.
 */
const pickDefaultAddressPincode = (addresses) => {
  const list = Array.isArray(addresses) ? addresses : [];
  const preferred =
    list.find((a) => Number(a?.default) === 1 && indianPincode(a?.zipCode)) ||
    list.find((a) => indianPincode(a?.zipCode));
  return indianPincode(preferred?.zipCode);
};
exports.pickDefaultAddressPincode = pickDefaultAddressPincode;

/**
 * Parse a monetary value out of an ONDC payload.
 *
 * Sellers should send a bare numeric string ("50.00"), but some decorate it —
 * "₹50.00", "Rs. 50", "1,234.50". parseFloat returns NaN on those and callers'
 * `|| 0` fallback silently turns a real charge into ₹0, which then flows into
 * the payable total, the platform-fee allocation and the Easy Split vendor
 * payout. Strip the decoration before parsing.
 *
 * Currency tokens are removed BEFORE the number is matched, because the dot in
 * "Rs." otherwise reads as a decimal point — "Rs.50" would parse as 0.5, wrong
 * by 100×. The sign is captured separately so "-₹15.00", where the symbol sits
 * between the minus and the digits, keeps its sign (ONDC discount rows are
 * negative). Returns `fallback` for anything still unparseable.
 */
const parseOndcAmount = (value, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (value == null) return fallback;
  const raw = String(value).replace(/,/g, "").trim();
  const negative = raw.startsWith("-");
  const match = raw.replace(/(?:₹|rs\.?|inr)/gi, "").match(/\d*\.?\d+/);
  const parsed = match ? parseFloat(match[0]) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return negative ? -Math.abs(parsed) : parsed;
};
exports.parseOndcAmount = parseOndcAmount;

// The network validator's FULFILLMENTS_END_LOCATION_GPS rule demands at least
// four decimal places on BOTH coordinates:
//   ^[-+]?([1-8]?\d|90)\.\d{4,},\s*[-+]?(180|1[0-7]\d|[1-9]?\d)\.\d{4,}$
// Six is comfortably inside that and is ~0.1m of precision, so no real location
// detail is lost by rounding to it.
const GPS_DECIMALS = 6;

/**
 * Format a "lat,lng" pair the way the ONDC validator insists on, or null when the
 * input cannot be trusted as a coordinate at all.
 *
 * A stored location is often coarser than the rule allows — a profile `latLng`
 * typed as "12.92,77.58" is a perfectly good coordinate but only two decimals, so
 * sending it verbatim was rejected outright:
 *
 *   NACK — All elements of $.message.order.fulfillments[*].end.location.gps
 *          must follow every regex in [...]
 *
 * Padding to six decimals changes nothing about where the point is ("12.92" and
 * "12.920000" are the same place); it only satisfies the format. Anything that is
 * NOT a coordinate — unparseable, wrong shape, or outside ±90/±180 — returns null
 * so the caller omits the key rather than inventing a location. The seller then
 * quotes from the pincode alone, which is the same fallback as having no gps.
 */
const normalizeOndcGps = (gps) => {
  if (gps == null) return null;
  const parts = String(gps).trim().split(",");
  if (parts.length !== 2) return null;

  const lat = Number(parts[0].trim());
  const lng = Number(parts[1].trim());
  // Number("") is 0, so an empty half ("12.9,") would otherwise pass as the
  // equator — reject a blank component explicitly.
  if (!parts[0].trim() || !parts[1].trim()) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return `${lat.toFixed(GPS_DECIMALS)},${lng.toFixed(GPS_DECIMALS)}`;
};
exports.normalizeOndcGps = normalizeOndcGps;

// ORDER_ID as the Workbench wrote it: ^[0-9a-zA-Z/-_]{1,36}$
//
// In a character class, `/-_` is a RANGE from `/` to `_` — it includes colon
// and does NOT include hyphen. A UUID with hyphens therefore fails this rule,
// which is why confirm mints a hyphen-stripped UUID (32 hex chars) instead.
const ONDC_ORDER_ID_RE = /^[0-9a-zA-Z/-_]{1,36}$/;

/**
 * Keep a BPP-issued order id when it already satisfies the network's regex;
 * otherwise return null so the caller can mint a fresh one.
 *
 * Sending an id the validator will refuse is how a confirm used to NACK on
 * ORDER_ID before the seller ever saw the order.
 */
const toOndcOrderId = (candidate) => {
  const raw = String(candidate || "").trim();
  return ONDC_ORDER_ID_RE.test(raw) ? raw : null;
};
exports.toOndcOrderId = toOndcOrderId;

/**
 * Same regex as ORDER_ID, used for fulfillments[*].id (FULFILLMENTS_ID).
 *
 * on_init often echoes a UUID with hyphens, or omits id entirely — both NACK
 * at /confirm. Strip hyphens when that recovers a valid token; otherwise the
 * caller-supplied fallback (usually "F1").
 */
const normalizeOndcNetworkId = (candidate, fallback = "F1") => {
  const kept = toOndcOrderId(candidate);
  if (kept) return kept;
  const stripped = toOndcOrderId(String(candidate || "").replace(/-/g, ""));
  if (stripped) return stripped;
  return fallback;
};
exports.normalizeOndcNetworkId = normalizeOndcNetworkId;

/**
 * Recipient name for `fulfillments[].end.person` — required at /confirm
 * (FULFILLMENTS_END_PERSON_NAME). Prefer a name the seller already echoed;
 * otherwise the billing name the buyer just submitted.
 */
const ondcRecipientName = (...candidates) => {
  for (const value of candidates) {
    const name = String(value || "").trim();
    if (name) return name;
  }
  return null;
};
exports.ondcRecipientName = ondcRecipientName;

/**
 * Narrow a cart's ONDC items to an explicit set of ondcProductIds — the "Buy
 * Now" path, which checks out a single product without disturbing the rest of
 * the cart.
 *
 * Both /select (validateOndcCart) and /init (initOndcOrder) re-read the whole
 * cart server-side and re-derive their seller groups from it, so both must be
 * scoped; the `groups` the client sends to /init are only transaction-id hints.
 *
 * Keyed on ondcProductId, not productId: productId is a listing row id that
 * changes on every catalog refresh, and ondcProductId is what
 * removeOndcProductsFromCart already matches on when clearing bought items.
 *
 * An empty/absent id list means "no scope" and returns everything — that is the
 * normal cart → checkout path, which must stay untouched.
 */
const scopeCartItems = (items = [], ondcProductIds) => {
  const ids = Array.isArray(ondcProductIds)
    ? ondcProductIds.map((id) => String(id ?? "").trim()).filter(Boolean)
    : [];
  if (!ids.length) return items;
  return items.filter((item) => ids.includes(String(item?.ondcProductId ?? "")));
};
exports.scopeCartItems = scopeCartItems;

/**
 * The Delivery leg. NOT fulfillments[0] — once a return is in play the array also
 * carries Return/Cancel legs and ONDC does not guarantee Delivery is first.
 * (Older call sites in this file still assume index 0; left alone deliberately.)
 */
const getDeliveryFulfillment = (order) =>
  (Array.isArray(order?.fulfillments) ? order.fulfillments : []).find((f) => f?.type === "Delivery") || null;
exports.getDeliveryFulfillment = getDeliveryFulfillment;

/**
 * Keyed on the FULFILLMENT state, not orderState: the RTO terminal states also
 * map the order to "Completed" without the buyer receiving anything, and must
 * never start a return clock.
 */
exports.isOrderDelivered = (order) =>
  getDeliveryFulfillment(order)?.state?.descriptor?.code === "Order-delivered";

/**
 * Delivery time per the BPP's own clock (Delivery leg `end.time.timestamp`).
 * Falls back to now when absent, unparseable, in the future, or >90 days stale —
 * a wrong BPP clock would otherwise shift the whole payout schedule.
 */
exports.resolveDeliveredAt = (order, now = new Date()) => {
  const raw = getDeliveryFulfillment(order)?.end?.time?.timestamp;
  if (!raw) return now;
  const at = new Date(raw);
  if (Number.isNaN(at.getTime()) || at > now || now - at > 90 * 86400000) return now;
  return at;
};

/**
 * The return window for a whole seller order, in ms: the LONGEST window across
 * the returnable lines, because the seller's money cannot move while any single
 * line can still come back. Lines come from quote.rows[] (snapshotted at confirm
 * by mapQuote in services/ondcOnConfirmPersist.js).
 *
 * `returnable: null` counts as returnable — holding money we might have to refund
 * is the safe side of that unknown. A returnable line with no declared window
 * falls back to settings.defaultReturnWindow, never to 0.
 *
 * @returns {{returnWindow: string|null, ms: number, returnable: boolean}}
 *   returnable:false means nothing can come back — hold only for the buffer.
 */
exports.resolveOrderReturnWindow = (order, settings = {}) => {
  const rows = Array.isArray(order?.quote?.rows) ? order.quote.rows : [];
  // Only item lines carry a window; delivery/tax breakup rows never do.
  const items = rows.filter((r) => r?.titleType === "item" && r?.returnable !== false);
  if (!items.length) return { returnWindow: null, ms: 0, returnable: false };

  const fallback = settings.defaultReturnWindow || null;
  let best = null;
  let bestMs = -1;
  for (const row of items) {
    const candidate = row.returnWindow || fallback;
    const ms = parseIsoDurationMs(candidate);
    if (ms !== null && ms > bestMs) [bestMs, best] = [ms, candidate];
  }
  if (bestMs >= 0) return { returnWindow: best, ms: bestMs, returnable: true };

  // Every candidate was missing/unparseable. Still returnable — report an unknown
  // window rather than 0 if even the default is unusable.
  const defaultMs = parseIsoDurationMs(fallback);
  return defaultMs !== null
    ? { returnWindow: fallback, ms: defaultMs, returnable: true }
    : { returnWindow: null, ms: 0, returnable: true };
};

/**
 * When the seller's share becomes releasable: delivery + window + buffer.
 * Nullish/empty is rejected BEFORE the Date constructor — `new Date(null)` is
 * epoch 0, not Invalid Date, which would yield a 1970 due date (i.e. `<= now`)
 * and pay the seller immediately.
 */
exports.computePayoutDueAt = (deliveredAt, returnWindowMs = 0, bufferMs = 0) => {
  if (deliveredAt === null || deliveredAt === undefined || deliveredAt === "") return null;
  const base = deliveredAt instanceof Date ? deliveredAt : new Date(deliveredAt);
  if (Number.isNaN(base.getTime())) return null;
  return new Date(base.getTime() + (returnWindowMs || 0) + (bufferMs || 0));
};

/**
 * The buyer-side payment facts for a confirmed ONDC order.
 *
 * A BPP echoes its OWN payment terms back on on_confirm. The DigiDukaan spec's
 * example returns `status: "NOT-PAID"`, `type: "ON-FULFILLMENT"`,
 * `collected_by: "BPP"` because that spec models pay-on-fulfilment collected by the
 * seller. Peko is the BAP and captures on Cashfree BEFORE /confirm — services/ondc.js
 * sends `status: "PAID"`, and confirmOndcOrder refunds that capture when a seller
 * fails to confirm, which only makes sense because the money is already taken.
 *
 * Persisting the echo therefore marked EVERY prepaid order "Not paid".
 *
 * When we hold our own Cashfree reference the buyer has demonstrably paid, so record
 * what we sent rather than what the seller echoed. Only a genuinely seller-collected
 * order (no Peko paymentRef, e.g. COD) falls back to the BPP's terms.
 *
 * `paymentRef` matters beyond display: orders.corporateTxnId is keyed on it, and the
 * refund and payout paths resolve the Cashfree order id through it. Storing the BPP's
 * `params.transaction_id` there (the spec's example is "3937") silently breaks both.
 *
 * @param {Object} payment the on_confirm `order.payment` block
 * @param {string|null} ourPaymentRef the checkout's Cashfree reference, if we collected
 * @returns {{paymentStatus: string|null, paymentType: string|null, collectedBy: string|null, paymentRef: string|null}}
 */
exports.resolveBuyerPayment = (payment = {}, ourPaymentRef = null) => {
  if (!ourPaymentRef) {
    // We did not collect — the seller's terms are the only source of truth.
    return {
      paymentStatus: payment?.status || null,
      paymentType: payment?.type || null,
      collectedBy: payment?.collected_by || null,
      paymentRef: payment?.params?.transaction_id || null,
    };
  }
  return {
    paymentStatus: "PAID",
    paymentType: "ON-ORDER",
    collectedBy: "BAP",
    paymentRef: String(ourPaymentRef),
  };
};

/**
 * Item value of a seller's ONDC quote — the `breakup` rows the seller tagged as
 * items, excluding delivery, tax, packing, misc and discount lines.
 *
 * This has to be summed rather than read: `quote.price.value` is the seller's
 * declared GRAND total and nothing in the codebase derives its components. The
 * buyer finder fee is charged on item value only, so it needs this figure.
 *
 * Returns `null` — not 0 — when the quote carries no item rows at all. The
 * caller must be able to tell "this order's items are worth nothing" from "this
 * seller sent a breakup we could not read", because charging a fee on the latter
 * would be guessing.
 *
 * @param {Object} quote raw ONDC `order.quote`
 * @returns {number|null} item subtotal to 2dp, or null when no item rows exist
 */
exports.sumQuoteItemsTotal = (quote) => {
  const itemRows = (quote?.breakup || []).filter(
    (row) => row?.["@ondc/org/title_type"] === "item"
  );
  if (!itemRows.length) return null;
  const total = itemRows.reduce((sum, row) => sum + parseOndcAmount(row?.price?.value), 0);
  return parseFloat(total.toFixed(2));
};

/**
 * Stamp the buyer finder fee this order was placed under onto each of its line
 * items, so every ordered product carries the commercial it was sold under.
 *
 * ONDC declares the fee ONCE per seller order (`order.payment`), never per item
 * — one /init carries all of a seller's SKUs against a single payment block. So
 * every line in a group necessarily gets the same figure; this is a record of
 * what was declared, not a per-product rate.
 *
 * Read off the order's own payment block rather than re-reading the live config:
 * the fee is admin-editable, and on_confirm can land long after /init, so the
 * current setting may no longer be the one this order went out with. Taking it
 * from the order keeps the line items consistent with `ondcOrders.payment`.
 *
 * The type is stored alongside the amount because a bare number is ambiguous —
 * "3" means something different under `percent` than under `amount`, and the
 * vendor-level type can be changed later.
 *
 * @param {Array<Object>} items the order's line items
 * @param {Object} payment the order's ONDC payment block
 * @returns {Array<Object>} items, each with buyerFinderFeeType/Amount added
 */
exports.stampBuyerFinderFee = (items = [], payment = {}) => {
  const type = payment?.["@ondc/org/buyer_app_finder_fee_type"] ?? null;
  const amount = payment?.["@ondc/org/buyer_app_finder_fee_amount"] ?? null;
  return (items || []).map((item) => ({
    ...item,
    buyerFinderFeeType: type,
    buyerFinderFeeAmount: amount,
  }));
};

/**
 * Assign ONE transaction_id per seller group, guaranteeing they are distinct.
 *
 * ONDC's transaction_id identifies a single order session with a single BPP, and
 * every correlation point on our side is keyed on it alone: the on_select/on_init
 * waiter registries, the parked init session, findLatestOnInitByTransactionId at
 * confirm time, and the Easy Split coordinator's `received` set. A cart spanning
 * two sellers must therefore never reuse one id across groups.
 *
 * It used to: both /select and /init fell back to the product snapshot's
 * `transactionId`, which is the *search* txn. A broadcast /search returns catalogs
 * from many sellers under ONE transaction_id, so two products discovered in the
 * same browse carried the same value — the two groups then collided on every key
 * above and neither order was placed.
 *
 * The preferred id is kept for the first group that claims it (so a single-seller
 * cart still correlates its order session with the discovery, exactly as before);
 * any later group that would collide gets a fresh uuid.
 *
 * @param {Array} groups the seller groups, in order
 * @param {(group: any, index: number) => string|null|undefined} preferredIdOf
 *        the id this group would like — a select hint, or the snapshot's search txn
 * @param {() => string} newId uuid factory
 * @returns {string[]} one distinct, non-empty transaction id per group, positionally aligned
 */
exports.assignGroupTransactionIds = (groups = [], preferredIdOf, newId) => {
  const taken = new Set();
  return groups.map((group, index) => {
    let preferred;
    try {
      preferred = typeof preferredIdOf === "function" ? preferredIdOf(group, index) : null;
    } catch (err) {
      preferred = null;
    }
    const claimed = preferred ? String(preferred) : "";
    if (claimed && !taken.has(claimed)) {
      taken.add(claimed);
      return claimed;
    }
    let fresh = newId();
    while (taken.has(String(fresh))) fresh = newId();
    taken.add(String(fresh));
    return String(fresh);
  });
};

/**
 * Resolve the cancellation fee percentage that applies to an ondcOrders row's
 * CURRENT fulfillment state, from the seller's declared `cancellation_terms`
 * schedule (order.cancellation_terms — captured at /confirm, refreshed on
 * every on_status since the applicable fee changes as fulfillment progresses;
 * see updateOndcOrderStatus in models/use-cases/ondc_order.js). Returns null
 * when the fulfillment state or a matching term is unavailable — callers must
 * treat that as "unknown", not "free".
 *
 * @param {Object} order an ondcOrders row (raw) — needs .fulfillments, .cancellationTerms
 * @returns {string|null} the matching cancellation_fee.percentage, or null
 */
exports.getApplicableCancellationFee = (order) => {
  const currentCode = order?.fulfillments?.[0]?.state?.descriptor?.code;
  const terms = order?.cancellationTerms;
  if (!currentCode || !Array.isArray(terms)) return null;
  const match = terms.find(
    (t) => t?.fulfillment_state?.descriptor?.code === currentCode
  );
  return match?.cancellation_fee?.percentage ?? null;
};

/**
 * Admin-facing tracking summary for an ondcOrders row — courier/link/status,
 * derived from the persisted fulfillment (agent/tags) and the last on_track
 * callback (row.tracking + row.trackingCheckedAt). Mirrors buildTrackingDto
 * in controllers/corporate/ondcEcommerce.js (the customer Order Details
 * page's tracking card) but is kept as an independent copy here rather than
 * shared, so this admin-only addition can't regress that already-working
 * flow. Returns null when there's genuinely nothing to show yet.
 *
 * @param {Object} order an ondcOrders row (raw) — needs .fulfillments, .tracking, .trackingCheckedAt
 * @returns {{status:?string, url:?string, courierName:?string, courierPhone:?string, updatedAt:?Date}|null}
 */
exports.getTrackingSummary = (order) => {
  const fulfillment = (order?.fulfillments || [])[0] || null;
  const trackingTag = (fulfillment?.tags || []).find((t) => t.code === "tracking");
  const tagList = trackingTag?.list || [];
  const tagValue = (code) => tagList.find((l) => l.code === code)?.value || null;

  const courierName = fulfillment?.agent?.name || null;
  const courierPhone = fulfillment?.agent?.phone || null;
  const track = order?.tracking || null;

  const url = track?.url || tagValue("url") || null;
  const status = track?.status || null;
  const updatedAt = order?.trackingCheckedAt || null;

  if (!track && !courierName && !url) return null;

  return { status, url, courierName, courierPhone, updatedAt };
};

const normalizeDomain = (domain) => {
  if (!domain) return null;
  return String(domain).trim().replace(/^ONDC:/i, "").toUpperCase();
};

/**
 * Protocol `context.domain` for a gateway /search. Category rows store bare
 * codes (`RET16`); the wire needs `ONDC:RET16`.
 */
const toOndcContextDomain = (domain) => {
  const code = normalizeDomain(domain);
  return code ? `ONDC:${code}` : null;
};

/** Bare code plus protocol form so WHERE clauses match either spelling. */
const domainAliases = (domain) => {
  const code = normalizeDomain(domain);
  if (!code) return [];
  return [`ONDC:${code}`, code];
};

exports.normalizeDomain = normalizeDomain;
exports.toOndcContextDomain = toOndcContextDomain;
exports.domainAliases = domainAliases;

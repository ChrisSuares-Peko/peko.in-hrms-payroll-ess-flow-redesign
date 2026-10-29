/**
 * Append-only order/fulfillment status history.
 *
 * on_status overwrites fulfillments with the CURRENT snapshot; this list is how
 * we keep Order confirmed → In progress → Agent-assigned instead of replacing
 * the UI with only the latest code.
 *
 * Order.state and fulfillment codes can map to the SAME buyer-facing label
 * (Accepted + Pending → "Order confirmed", Completed + Order-delivered →
 * "Delivered"). Consecutive items with the same label are skipped.
 */

const HISTORY_CAP = 50;
const HISTORY_FULFILLMENT_TYPES = new Set(["Delivery", "Return"]);

const ORDER_STATE_LABELS = {
  Created: "Order created",
  Accepted: "Order confirmed",
  "In-progress": "In progress",
  Completed: "Delivered",
  Cancelled: "Cancelled",
  Returned: "Returned",
};

const FULFILLMENT_STATE_LABELS = {
  Pending: "Order confirmed",
  Packed: "Packed by seller",
  "Agent-assigned": "Delivery agent assigned",
  "Out-for-pickup": "Out for pickup",
  "Pickup-failed": "Pickup attempt failed",
  "Order-picked-up": "Picked up",
  "In-transit": "In transit",
  "At-destination-hub": "Reached destination hub",
  "Out-for-delivery": "Out for delivery",
  "Delivery-failed": "Delivery attempt failed",
  "Order-delivered": "Delivered",
  Cancelled: "Cancelled",
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const displayLabel = (event) => {
  const code = event?.code;
  if (!code) return "";
  if (event.kind === "order") {
    return ORDER_STATE_LABELS[code] || String(code).replace(/-/g, " ");
  }
  return FULFILLMENT_STATE_LABELS[code] || String(code).replace(/[-_]/g, " ");
};

const lastMatching = (history, event) => {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry?.kind !== event.kind) continue;
    if (event.kind === "fulfillment" && entry.fulfillmentType !== event.fulfillmentType) continue;
    return entry;
  }
  return null;
};

const makeEvent = ({ kind, code, source, fulfillmentType = null, at }) => ({
  at: at || new Date().toISOString(),
  source: source || "on_status",
  kind,
  code: String(code),
  fulfillmentType: fulfillmentType || null,
});

const shouldAppend = (history, event) => {
  if (!event?.code) return false;
  const lastSameKind = lastMatching(history, event);
  if (lastSameKind && lastSameKind.code === event.code) return false;
  const last = history[history.length - 1];
  if (last && displayLabel(last) === displayLabel(event)) return false;
  return true;
};

/**
 * Drop consecutive entries that would render as the same step (already-stored
 * Accepted + Pending, Completed + Order-delivered, etc.).
 */
const dedupeStatusHistory = (history) => {
  const out = [];
  for (const entry of asArray(history)) {
    const prev = out[out.length - 1];
    if (prev && displayLabel(prev) === displayLabel(entry)) continue;
    out.push(entry);
  }
  return out;
};

/**
 * The same append, but also reporting WHICH events are new — the signal the buyer
 * notification emails fire on (services/ondcOrderStatusNotify.js).
 *
 * `appended` is computed by REFERENCE IDENTITY, not by comparing lengths: the
 * final dedupe pass can drop an event that shouldAppend accepted, and the
 * HISTORY_CAP slice can drop one off the front, so `next.length - prev.length`
 * would both miss real transitions and invent phantom ones. dedupeStatusHistory
 * and slice both preserve the entry objects themselves, so `includes` is exact.
 *
 * This is what makes the emails safe on an at-least-once callback: a replayed
 * identical on_status appends nothing, so `appended` is empty and nothing mails.
 *
 * @param {Array|null} existing
 * @param {{ orderState?: string|null, fulfillments?: Array }} snapshot
 * @param {string} [source]
 * @param {string} [at]
 * @returns {{ history: Array, appended: Array }}
 */
const diffStatusHistory = (existing, snapshot = {}, source = "on_status", at) => {
  const history = asArray(existing).slice();
  const when = at || new Date().toISOString();
  const candidates = [];

  if (snapshot.orderState) {
    const event = makeEvent({
      kind: "order",
      code: snapshot.orderState,
      source,
      at: when,
    });
    if (shouldAppend(history, event)) {
      history.push(event);
      candidates.push(event);
    }
  }

  for (const fulfillment of asArray(snapshot.fulfillments)) {
    const type = fulfillment?.type;
    if (!HISTORY_FULFILLMENT_TYPES.has(type)) continue;
    const code = fulfillment?.state?.descriptor?.code;
    if (!code) continue;
    const event = makeEvent({
      kind: "fulfillment",
      code,
      source,
      fulfillmentType: type,
      at: when,
    });
    if (shouldAppend(history, event)) {
      history.push(event);
      candidates.push(event);
    }
  }

  const next = dedupeStatusHistory(history).slice(-HISTORY_CAP);
  return { history: next, appended: candidates.filter((event) => next.includes(event)) };
};

/**
 * @param {Array|null} existing
 * @param {{ orderState?: string|null, fulfillments?: Array }} snapshot
 * @param {string} [source]
 * @param {string} [at]
 * @returns {Array}
 */
const appendStatusHistory = (existing, snapshot = {}, source = "on_status", at) =>
  diffStatusHistory(existing, snapshot, source, at).history;

module.exports = {
  HISTORY_CAP,
  appendStatusHistory,
  diffStatusHistory,
  dedupeStatusHistory,
  displayLabel,
};

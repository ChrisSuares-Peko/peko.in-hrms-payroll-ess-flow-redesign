/**
 * Courier, AWB and time-window facts pulled out of an ONDC fulfillment, for the
 * shipped / out-for-delivery / return-pickup emails.
 *
 * Everything here is DERIVED AT RENDER TIME — no new columns. ondcOrders sits at
 * InnoDB's row-size limit (see the entity's own notes), and none of these values
 * is read by anything but an email.
 *
 * Every function returns null when the seller didn't send the data, because the
 * templates' detailLine() drops a line with an empty value. A template must never
 * print "AWB: N/A" — an absent line reads as "not applicable yet", a placeholder
 * reads as a broken email.
 */

const { getDeliveryFulfillment } = require("./ondc_helper");

const asArray = (value) => (Array.isArray(value) ? value : []);

const trimmed = (value) => {
  const text = value == null ? "" : String(value).trim();
  return text || null;
};

/** The `list` of a named tag on a fulfillment, e.g. tags[code=tracking]. */
const tagList = (fulfillment, code) =>
  asArray(asArray(fulfillment?.tags).find((tag) => tag?.code === code)?.list);

const tagValue = (fulfillment, tagCode, entryCode) =>
  trimmed(tagList(fulfillment, tagCode).find((entry) => entry?.code === entryCode)?.value);

/**
 * ONDC RET1.2 has no first-class AWB field. Real BPPs put it in the `tracking`
 * tag list under one of several spellings, so match a set rather than one key.
 *
 * NOT `fulfillment.id` — that is the leg id ("F1"), and printing it as an AWB
 * would send buyers to a courier site with a number that means nothing.
 *
 * @param {Object} row an ondcOrders row (uses fulfillments + the on_track block)
 */
const AWB_CODES = /^(awb|awb_no|awb_number|awbno|tracking_no|tracking_number|waybill)$/i;

const getAwbNumber = (row) => {
  for (const fulfillment of asArray(row?.fulfillments)) {
    const entry = tagList(fulfillment, "tracking").find((item) => AWB_CODES.test(String(item?.code || "")));
    const value = trimmed(entry?.value);
    if (value) return value;
  }
  // on_track's tracking block can carry the consignment id instead.
  return trimmed(row?.tracking?.id);
};

/** Courier/agent name off the Delivery leg (falls back to any leg that has one). */
const getCourierName = (row) => {
  const delivery = getDeliveryFulfillment(row);
  const fromDelivery = trimmed(delivery?.agent?.name);
  if (fromDelivery) return fromDelivery;
  for (const fulfillment of asArray(row?.fulfillments)) {
    const name = trimmed(fulfillment?.agent?.name);
    if (name) return name;
  }
  return null;
};

/**
 * The seller's own tracking page, but only when the seller says it works:
 * tags[tracking].url_enabled must not be "no". Offered as a secondary link in the
 * body — never as the primary CTA, which always points at our own order page.
 */
const getSellerTrackingUrl = (row) => {
  for (const fulfillment of asArray(row?.fulfillments)) {
    const enabled = tagValue(fulfillment, "tracking", "url_enabled");
    if (String(enabled || "").toLowerCase() === "no") continue;
    const url = tagValue(fulfillment, "tracking", "url");
    if (url) return url;
  }
  return trimmed(row?.tracking?.url);
};

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timeOnly = (value) => {
  const date = asDate(value);
  return date
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    : null;
};

const dayOnly = (value) => {
  const date = asDate(value);
  return date
    ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" })
    : null;
};

/**
 * Render a { start, end } time range as one human window.
 *   both  -> "10:30 AM – 1:00 PM, 16 Jul"
 *   start -> "from 10:30 AM, 16 Jul"
 *   none  -> null
 */
const formatRange = (range) => {
  const start = asDate(range?.start);
  const end = asDate(range?.end);
  if (!start && !end) return null;
  if (start && end) return `${timeOnly(start)} – ${timeOnly(end)}, ${dayOnly(end)}`;
  const only = start || end;
  return `${start ? "from" : "by"} ${timeOnly(only)}, ${dayOnly(only)}`;
};

/**
 * The delivery window for the out-for-delivery mail: the Delivery leg's
 * `end.time.range`, falling back to its single `end.time.timestamp`.
 */
const getDeliveryWindow = (row) => {
  const delivery = getDeliveryFulfillment(row) || asArray(row?.fulfillments)[0];
  const window = formatRange(delivery?.end?.time?.range);
  if (window) return window;
  const stamp = timeOnly(delivery?.end?.time?.timestamp);
  return stamp ? `expected by ${stamp}` : null;
};

/**
 * The pickup window for a return: a Return leg's pickup is its START, not its end
 * (the buyer's door is where the leg begins). `end.time.range` is the fallback for
 * sellers that fill only one side.
 */
const getPickupWindow = (returnFulfillment) =>
  formatRange(returnFulfillment?.start?.time?.range) ||
  formatRange(returnFulfillment?.end?.time?.range);

/** Just the date part of the pickup slot, for the "Pickup date:" row. */
const getPickupDate = (returnFulfillment) => {
  const raw =
    returnFulfillment?.start?.time?.range?.start ||
    returnFulfillment?.start?.time?.timestamp ||
    returnFulfillment?.end?.time?.range?.start;
  const date = asDate(raw);
  return date
    ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
    : null;
};

/**
 * The delivery address as one line, from the Delivery leg the seller echoed back
 * (which is authoritative), falling back to the billing snapshot we sent.
 */
const getDeliveryAddressLine = (row) => {
  const delivery = getDeliveryFulfillment(row) || asArray(row?.fulfillments)[0];
  const address = delivery?.end?.location?.address || row?.billing?.address || {};
  const recipient = trimmed(delivery?.end?.person?.name) || trimmed(row?.billing?.name);
  const parts = [
    recipient,
    trimmed(address.name),
    trimmed(address.building),
    trimmed(address.locality),
    trimmed(address.city),
    trimmed(address.state),
    trimmed(address.area_code) || trimmed(address.areaCode),
  ].filter(Boolean);
  // De-duplicate the very common case where two address fields carry the same text.
  const seen = new Set();
  const unique = parts.filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.length ? unique.join(", ") : null;
};

module.exports = {
  getAwbNumber,
  getCourierName,
  getSellerTrackingUrl,
  getDeliveryWindow,
  getPickupWindow,
  getPickupDate,
  getDeliveryAddressLine,
  formatRange,
  tagValue,
  tagList,
};

/**
 * Internal ops alert: an ONDC office-supplies order has blown its promised
 * fulfilment TAT. Goes to the Peko team, never to a customer — the tone and the
 * action list assume the reader can act on the order.
 *
 * Pure string building, no DB and no HTTP, so the wording and every fallback is
 * unit-testable. services/ondcTatBreach.js resolves the data; this only renders it.
 *
 * Lives here rather than being imported from purchase because no module in this
 * service crosses the service boundary — template duplication is the norm here
 * (see the two copies of emailTempleteInvoiceRemainder).
 */

/** Shown wherever the network participant gave us no contact, so ops chases it
 *  rather than assuming the template broke. */
const NOT_ON_FILE = "not on file";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** "not on file" reads better than an empty gap for anything genuinely missing. */
const orNotOnFile = (value) => {
  const raw = String(value ?? "").trim();
  return raw === "" ? NOT_ON_FILE : raw;
};

const formatDate = (value) => {
  if (!value) return NOT_ON_FILE;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return NOT_ON_FILE;
  return at.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Subject line. Format is fixed by ops — keep it stable, they filter on it.
 * `Peko IN | Office Supplies | TAT breached - Order {id} | {np} | {n} day(s) overdue`
 */
const buildTatBreachSubject = ({ orderId, sellerNpName, daysOverdue }) =>
  `Peko IN | Office Supplies | TAT breached - Order ${orNotOnFile(orderId)} | ` +
  `${orNotOnFile(sellerNpName)} | ${Number(daysOverdue) || 0} day(s) overdue`;

/**
 * @param {Object} p resolved by services/ondcTatBreachSweep.js
 * @param {string} p.orderId          BPP order id, else our transaction id
 * @param {string} p.itemSummary      "Pens × 2, Paper × 1"
 * @param {number} p.fulfilmentAmount what the buyer paid (amountPaid)
 * @param {string} p.buyerCompanyName corporate company name (not the checkout contact)
 * @param {string} p.buyerCity        billing city, else pincode
 * @param {string} p.providerName     the shop (ondcOrders.vendorName)
 * @param {string} p.sellerNpName     the seller app; falls back to bppId
 * @param {string} p.npContactEmail
 * @param {string} p.npContactPhone
 * @param {Date}   p.expectedDate     the promise we are measuring against
 * @param {boolean} p.expectedDateIsFallback true when the BPP declared no TAT and
 *                                    the date is createdAt + fallback, not a promise
 * @param {number} p.daysOverdue
 * @param {string} p.lastOndcStatus
 * @param {Date}   p.lastStatusTimestamp OUR last-observed time, not the BPP's clock
 */
const buildTatBreachEmail = (p = {}) => {
  const days = Number(p.daysOverdue) || 0;
  const npName = orNotOnFile(p.sellerNpName);
  const amount = formatAmount(p.fulfilmentAmount);
  const expected = p.expectedDateIsFallback
    ? `${formatDate(p.expectedDate)} (no TAT declared by the seller — assumed)`
    : formatDate(p.expectedDate);

  const line = (text) => `<p style="margin:0 0 6px">${text}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>TAT breached</title></head>
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1e293b">
  ${line("Hi Team,")}
  ${line("This Office Supplies order has exceeded its promised fulfilment TAT and needs intervention.")}
  <div style="margin:16px 0">
    ${line(`<strong>Order:</strong> ${esc(orNotOnFile(p.orderId))} &middot; ${esc(orNotOnFile(p.itemSummary))} &middot; &#8377;${esc(amount)}`)}
    ${line(`<strong>Customer:</strong> ${esc(orNotOnFile(p.buyerCompanyName))}, ${esc(orNotOnFile(p.buyerCity))}`)}
    ${line(`<strong>Seller:</strong> ${esc(orNotOnFile(p.providerName))} via ${esc(npName)}`)}
    ${line(`<strong>Expected delivery:</strong> ${esc(expected)} &middot; Overdue by ${days} day(s)`)}
    ${line(`<strong>Current status:</strong> ${esc(orNotOnFile(p.lastOndcStatus))}, updated ${esc(formatDate(p.lastStatusTimestamp))}`)}
  </div>
  ${line("<strong>Actions (in order):</strong>")}
  <ol style="margin:0 0 16px;padding-left:20px">
    <li>Get a revised delivery date from ${esc(npName)} &mdash; ${esc(orNotOnFile(p.npContactEmail))} / ${esc(orNotOnFile(p.npContactPhone))}</li>
    <li>No response in 24 hrs &rarr; raise an IGM issue from the order's Issues tab</li>
    <li>Delivery not confirmable &rarr; cancel the undelivered fulfilment and refund &#8377;${esc(amount)}</li>
  </ol>
  ${line("Regards,<br>Team Peko")}
</body>
</html>`;
};

module.exports = {
  NOT_ON_FILE,
  buildTatBreachSubject,
  buildTatBreachEmail,
};

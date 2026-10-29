/**
 * Accessors for an ONDC order's `documents` block — the [{ url, label }] array a BPP
 * returns on on_status once paperwork exists (see status_res.json for the shape).
 *
 * Stored verbatim on ondcOrders.documents and interpreted here, so the label matching
 * has one home rather than being restated by the email, the buyer DTO and the admin page.
 */

// Sellers are inconsistent about the label: the spec samples use "Invoice", real BPPs
// also send "Invoice_link" and lower/mixed case. Matched loosely rather than exactly.
const isInvoiceLabel = (label) => /invoice/i.test(String(label || ""));

/**
 * The order's invoice document, or null.
 *
 * Falls back to the first entry carrying a url when nothing is labelled an invoice —
 * a seller who sends exactly one unlabelled document means the invoice, and dropping
 * it would leave the buyer with nothing. An entry without a url is never returned:
 * every caller either links to it or mails it.
 *
 * @param {Array<{url?:string,label?:string}>|null|undefined} documents
 * @returns {{url:string,label:string|null}|null}
 */
const getInvoiceDocument = (documents) => {
  if (!Array.isArray(documents)) return null;
  const withUrl = documents.filter((d) => d && typeof d.url === "string" && d.url.trim());
  const invoice = withUrl.find((d) => isInvoiceLabel(d.label)) || withUrl[0] || null;
  if (!invoice) return null;
  return { url: invoice.url.trim(), label: invoice.label || null };
};

/** Convenience for the DTOs — the invoice url or null. */
const getInvoiceUrl = (documents) => getInvoiceDocument(documents)?.url || null;

/**
 * Every place an invoice can hide on an on_status order.
 *
 * The spec samples put `documents` on `message.order`, and that is what the webhook
 * guards on and what updateOndcOrderStatus persists. But real BPPs also attach it to
 * the FULFILLMENT (status_res_with_invoice.json in this repo does exactly that:
 * `fulfillments[0].documents`, with nothing at order level) — and for those sellers
 * the buyer never got their invoice mail at all.
 *
 * Order level wins when both are present: it describes the order, not one leg.
 *
 * @param {Object} order an ONDC order from a callback, or an ondcOrders row
 * @returns {Array<{url?:string,label?:string}>} possibly empty, never null
 */
const collectOrderDocuments = (order) => {
  const atOrder = Array.isArray(order?.documents) ? order.documents : [];
  if (atOrder.length) return atOrder;
  const fulfillments = Array.isArray(order?.fulfillments) ? order.fulfillments : [];
  return fulfillments.flatMap((f) => (Array.isArray(f?.documents) ? f.documents : []));
};

module.exports = { getInvoiceDocument, getInvoiceUrl, isInvoiceLabel, collectOrderDocuments };

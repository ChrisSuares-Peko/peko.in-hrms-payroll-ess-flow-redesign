/**
 * Invoice email for ONDC (office supplies) orders.
 *
 * Mirrors services/ondcRefundCancelNotify.js: resolve recipient -> render template ->
 * emailer.email() -> customLog, fully guarded so a mail/lookup/template failure can
 * never affect the ONDC callback that triggered it.
 *
 * The one thing this does that the others don't is CLAIM before it sends. on_status is
 * not a one-off: the delivery poll re-asks every cycle and every reply carries the same
 * documents block, so an unguarded send would mail the buyer their invoice hourly.
 */

const emailer = require("../utils/emailer");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const { ondcInvoiceAvailableTemplate } = require("../utils/emailTemplate/ecommerce");
const { getInvoiceDocument } = require("../utils/ondcDocuments");
const { partnerLogos } = require("../utils/partnerLogos");
const { customLog } = require("../utils/loggerHelper");
const { claimOndcOrderInvoiceEmail } = require("../models/use-cases/ondc_order");
const { resolveCorporateRecipient } = require("./ondcRefundCancelNotify");

const FLOW = "ondcInvoiceNotify";

const sendEmail = (to, subject, body) =>
  new Promise((resolve) => {
    emailer.email(to, subject, body, () => resolve());
  });

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;
};

/**
 * Mail the buyer their invoice, at most once per order.
 *
 * Order of operations matters and is deliberate:
 *   1. no invoice on the row            -> nothing to send
 *   2. invoiceEmailSentAt already set   -> cheap short-circuit, no query
 *   3. no recipient                     -> skip WITHOUT claiming
 *   4. claim invoiceEmailSentAt         -> compare-and-set from NULL
 *   5. send only if the claim was won
 *
 * Step 3 before step 4 is the important one: claiming a row we then fail to email
 * about would silence that invoice permanently.
 */
const sendOndcInvoiceEmail = async ({ row, logTraceId } = {}) => {
  try {
    const invoice = getInvoiceDocument(row?.documents);
    if (!invoice) return;
    if (row?.invoiceEmailSentAt) return;

    const corporate = await resolveCorporateRecipient(row);
    const to = corporate?.email;
    if (!to) {
      customLog(logTraceId, "warn", {
        flow: FLOW,
        step: "invoice-email-skip",
        message: "No corporate email resolved — skipping invoice mail (row NOT claimed, so a later callback can still send)",
        ondcOrderId: row?.id,
        corporateUserId: row?.corporateUserId || null,
      }, "VENDOR");
      return;
    }

    const claimed = await claimOndcOrderInvoiceEmail({ id: row.id });
    if (!claimed) {
      customLog(logTraceId, "info", {
        flow: FLOW,
        step: "invoice-email-skip",
        message: "Invoice mail already claimed by another callback — not sending again",
        ondcOrderId: row?.id,
      }, "VENDOR");
      return;
    }

    const name = corporate?.contactPersonName || corporate?.name || "there";
    const templateDetails = corporate?.registeredBy
      ? await fetchPartnerDetails(corporate.registeredBy)
      : await partnerLogos();
    const body = ondcInvoiceAvailableTemplate(
      name,
      {
        // Gives the mail a Track Shipment button alongside Download invoice, the
        // same CTA pair the 15 notification templates carry.
        ondcOrderId: row?.id,
        orderId: row?.orderId || row?.transactionId,
        vendorName: row?.vendorName?.trim() || null,
        amount: formatAmount(row?.amountPaid ?? row?.totalAmount),
        invoiceUrl: invoice.url,
      },
      templateDetails
    );
    await sendEmail(to, "Your invoice is ready", body);

    customLog(logTraceId, "info", {
      flow: FLOW,
      step: "invoice-email-sent",
      message: "Invoice email sent",
      ondcOrderId: row?.id,
      to,
      invoiceUrl: invoice.url,
    }, "VENDOR");
  } catch (err) {
    customLog(logTraceId, "error", {
      flow: FLOW,
      step: "invoice-email-failed",
      message: err?.message || String(err),
      ondcOrderId: row?.id,
    }, "VENDOR");
  }
};

module.exports = { sendOndcInvoiceEmail };

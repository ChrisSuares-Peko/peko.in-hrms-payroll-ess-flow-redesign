/**
 * The Office Supplies (ONDC) buyer notification emails.
 *
 * ============================================================================
 * TRANSCRIBED FROM THE SPEC — do not restyle or reword from taste.
 * Copy and structure: a.pdf (revised 2026-08-24).
 * Visual design: "Office_Supplies_Email_Templates", Google Docs id
 * 1hszk0WLWN7uNI0Qh1GCBXiEouurJSfTmI4o-dhGUQ-E, measured off its HTML export.
 * ============================================================================
 *
 * TWELVE templates, numbered 1..15 with gaps. The revision deleted three:
 *   2  Payment Receipt  -> folded into 1, which now carries the payment block
 *   3  Payment Failed   -> deleted outright; payment failure sends nothing
 *   5  Order Packed     -> deleted; `Packed` is a silent code in the dispatcher
 * The gaps in the numbering are the spec's, and are kept so a template can still
 * be traced to its section in the document.
 *
 * Shape of every template:
 *
 *     Hi {{customer_name}},
 *     <one intro line>
 *     <block of plain "Label: value" lines>
 *     [ Order summary: + item table ]        <- on 1, 6, 8, 9, 10, 11, 12, 14
 *     <closing line(s), muted>               <- after the table where present
 *     [ Track Shipment ]                     <- ONE red block; two only on 15
 *     Thank you for shopping with us.
 *     If you have any queries ... reach@peko.one ...
 *     Best Regards,
 *     Team {{branding}} (falls back to "Peko" when there is no partner)
 *
 * Conventions:
 *   - Signature is always (name, details, templateDetails).
 *   - MISSING DATA OMITS ITS WHOLE LINE. detailLine() returns "" for an empty
 *     value and detailBlock() drops it, so a seller that never sent an AWB simply
 *     produces no AWB line. Never render "N/A" — an absent line reads as "not
 *     applicable yet", a placeholder reads as a broken email.
 *   - Templates are pure and never throw. They run on fire-and-forget notify
 *     paths where an exception becomes a silently missing email.
 *   - Subjects live here too, so the sender and the spec can't drift apart.
 *
 * Deliberate, approved divergences from the PDF, each flagged where it happens:
 *   - #12's "Expected in your account by: 3-5 business days" renders the shared
 *     5–7 figure instead, so all four refund-adjacent mails quote one timeline.
 *   - The `- revise` / `- revised` marks on the PDF's subjects for 8 and 11 are
 *     editorial notes, not subject text, and are not rendered.
 *
 * Per-CHECKOUT vs per-SELLER-ORDER matters for the subject. One checkout creates
 * one ondcOrders row per seller, each with its own orderId, courier and timeline:
 *   per checkout     -> 1 Order Confirmation
 *   per seller order -> 4, 6..15
 * A three-seller checkout gets three "shipped" mails. That is correct: those
 * parcels ship, arrive and are cancellable separately. See the non-goals note in
 * services/ondcOrderStatusNotify.js.
 */

const {
  ondcEmailShell,
  officeSuppliesLinks,
  bodyPara,
  mutedPara,
  strongPara,
  spacer,
  detailLine,
  detailBlock,
  ctaRow,
  signOff,
  money,
  itemTable,
} = require("./ondcShell");

// Order Confirmation (below) and buyer-cancellation confirmation (further down)
// deliberately do NOT use the ONDC shell above - per explicit approval, each
// must match its own Figma design exactly, which is the v2 admin-template look
// used elsewhere in this project, not the ONDC spec's plain-text style. Every
// other template in this file stays on the ONDC shell untouched.
const { v2Header, v2Footer, v2RejectBadge, v2SuccessBadge, socialIconCells, websiteLabel, PEKO_SOCIAL_LINKS } = require("./sharedLayout");

// How long a gateway refund takes to reach a card/account. ONE constant across
// every mail that quotes a timeline (10, 11, 12, 15) so two emails about the same
// refund can never contradict each other.
//
// The revised PDF hardcodes "3-5 business days" in template 12 while leaving
// {{refund_timeline}} in 10, 11 and 15. Keeping a single figure was an explicit
// decision — a buyer who receives both a cancellation and a refund-initiated mail
// must not see two different promises.
const REFUND_TIMELINE_DAYS = 7;
const REFUND_TIMELINE_TEXT = "5–7 business days";

/** The item table under its "Order summary:" label, or "" when there are no rows. */
const orderSummary = (items, total) => {
  const table = itemTable(items, { total });
  return table ? `${strongPara("Order summary:")}${table}` : "";
};

/**
 * Assemble the spec's body. `extra` is the item table (it sits after the detail
 * block); `closing` is the muted line that follows it, before the buttons.
 *
 * @param {Array<{label,href}>} buttons one entry on almost every template
 */
const page = ({ name, intro, lines = [], extra = "", closing = "", buttons = [] }, templateDetails, title) => {
  const inner = [
    bodyPara(`Hi ${name},`),
    bodyPara(intro),
    detailBlock(lines),
    extra,
    closing ? mutedPara(closing) : "",
    spacer(6),
    ctaRow(buttons),
    spacer(10),
    signOff(templateDetails && templateDetails.branding),
  ]
    .filter(Boolean)
    .join("");
  return ondcEmailShell(title, templateDetails, inner);
};

const idList = (ids) => (Array.isArray(ids) ? ids.filter(Boolean).join(", ") : ids || "");

// The v2-style "Product Name / Unit Price / Quantity / Total Amount" table used
// only by the Figma-matching Order Confirmation email below - a different shape
// (and no item image column) from the ONDC shell's own itemTable().
const V2_FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const v2OrderItemsTable = (items, { sellerName } = {}) => {
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!rows.length) return "";

  const th = (label, align) =>
    `<td align="${align}" style="background-color:#F3F4F6;border-bottom:1px solid #E5E7EB;padding:8px;text-align:${align};font-family:${V2_FONT};font-size:13px;font-weight:700;color:#000000;">${label}</td>`;
  const td = (html, align) =>
    `<td align="${align}" style="border-bottom:1px solid #E5E7EB;padding:8px;text-align:${align};font-family:${V2_FONT};font-size:14px;color:#000000;">${html}</td>`;

  const head = `<tr>${th("Product Name", "left")}${th("Unit Price", "right")}${th("Quantity", "center")}${th("Total Amount", "right")}</tr>`;
  const body = rows
    .map((item) => {
      const quantity = Number(item.quantity) || 1;
      const total = Number(item.price);
      const unit = Number.isFinite(total) ? total / quantity : null;
      return `<tr>${td(item.productName || "Item", "left")}${td(money(unit) || "&mdash;", "right")}${td(quantity, "center")}${td(money(item.price) || "&mdash;", "right")}</tr>`;
    })
    .join("");

  const heading = sellerName
    ? `<div style="font-family:${V2_FONT};font-size:14px;font-weight:700;color:#000000;padding:12px 0 4px;">${sellerName}</div>`
    : "";

  return `${heading}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${head}${body}</table>`;
};

/** The single "Track Shipment" CTA that ten of the twelve templates carry. */
const trackShipment = (links) => [{ label: "Track Shipment", href: links.track || links.manage }];

// ===========================================================================
// 1. Order Confirmation — order successfully placed. Per CHECKOUT.
// ===========================================================================
/**
 * Rebuilt to match the "Peko Emails 2.0" Figma design exactly (per explicit
 * approval) rather than the ONDC shell's plain-text style every other template
 * in this file uses. Figma's mockup shows a single flat product row; a Peko
 * checkout can span several sellers, so that part is kept from the original
 * (one table per seller, grand total on the last) rather than copied literally.
 * Figma also shows a "Mobile Number" and "Remarks" line - sourced from
 * billing.phone / billing.remarks when the on_confirm payload carries them,
 * and omitted (not faked) otherwise, same as every other field here. Figma's
 * "Shipping & handling" row still has no data source anywhere in this email's
 * details, so it stays omitted.
 *
 * @param {Object} details {
 *   orderIds: string[], sellerNames: string[], deliveryAddress, transactionId,
 *   paymentDateTime, orderTotal, ondcOrderId, groups: [{ sellerName, items }]
 * }
 */
exports.osOrderConfirmedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });
  const groups = Array.isArray(d.groups) ? d.groups : [];
  const orderIds = idList(d.orderIds);
  const manageUrl = links.track || links.manage;

  const website = (templateDetails && templateDetails.baseUrl) || "https://in.peko.one";
  const logo = templateDetails && templateDetails.logo;
  const branding = (templateDetails && templateDetails.branding) || "Peko";
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: "0 16px" }), branding });

  const summaryRow = (label, value) =>
    value
      ? `<tr><td style="padding:4px 0;font-family:${V2_FONT};font-size:14px;color:#000000;"><strong>${label}</strong></td><td align="right" style="padding:4px 0;font-family:${V2_FONT};font-size:14px;color:#000000;">${value}</td></tr>`
      : "";

  // The spec's mockup shows a single seller; a Peko checkout can span several,
  // so a multi-seller order still gets one table per seller here too.
  const itemsHtml = groups.length
    ? groups.map((group) => v2OrderItemsTable(group.items, { sellerName: groups.length > 1 ? group.sellerName : null })).join("")
    : v2OrderItemsTable(d.items);

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order Confirmation</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order Confirmation" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">${v2SuccessBadge()}</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order Confirmation</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Hi ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for your order. Your estimated delivery date is indicated below.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">If you would like to view the status of your order or make any changes to it, please visit <a href="${manageUrl}" style="color:#FF4F4F;text-decoration:underline;">office supplies on ${branding}</a>.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:12px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:20px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order Summary</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                                    ${summaryRow("Order", orderIds)}
                                    ${summaryRow("Placed on", d.paymentDateTime)}
                                    ${summaryRow("Delivery Address", d.deliveryAddress)}
                                    ${summaryRow("Mobile Number", d.mobileNumber)}
                                    ${summaryRow("Remarks", d.remarks)}
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:12px;word-break:break-word;">
                                  ${itemsHtml}
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                                    <tr>
                                      <td style="padding-top:8px;font-family:${V2_FONT};font-size:16px;font-weight:700;color:#000000;">Grand Total</td>
                                      <td align="right" style="padding-top:8px;font-family:${V2_FONT};font-size:16px;font-weight:700;color:#000000;">${money(d.orderTotal) || ""}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

// ===========================================================================
// 4. Order Accepted by Seller — on_status: Accepted. Per SELLER ORDER.
// ===========================================================================
/** @param {Object} details { orderId, sellerName, expectedDelivery, ondcOrderId } */
exports.osOrderAcceptedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  return page(
    {
      name,
      intro: `${d.sellerName || "The seller"} has accepted your order and we will notify you once the order has been shipped.`,
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Expected delivery:", d.expectedDelivery),
      ],
      buttons: trackShipment(links),
    },
    templateDetails,
    "Order accepted"
  );
};

// ===========================================================================
// 6. Order Shipped / Dispatched — with AWB/tracking. Per SELLER ORDER.
// ===========================================================================
/**
 * @param {Object} details { orderId, courierName, awbNumber, expectedDelivery,
 *   items, orderTotal, ondcOrderId }
 *
 * ONDC has no first-class AWB field — see utils/ondcTracking.js getAwbNumber.
 * When the seller didn't send one, that line simply doesn't render.
 */
exports.osOrderShippedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  return page(
    {
      name,
      intro: "Your order has been dispatched and is on its way to you.",
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Courier partner:", d.courierName),
        detailLine("AWB / Tracking number:", d.awbNumber),
        detailLine("Expected delivery:", d.expectedDelivery),
      ],
      extra: orderSummary(d.items, d.orderTotal),
      buttons: trackShipment(links),
    },
    templateDetails,
    "Order shipped"
  );
};

// ===========================================================================
// 7. Out for Delivery — on_status: Out-for-delivery. Per SELLER ORDER.
// ===========================================================================
/** @param {Object} details { orderId, courierName, deliveryWindow, ondcOrderId } */
exports.osOutForDeliveryTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  return page(
    {
      name,
      intro: "Your order is out for delivery and will reach you soon",
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Delivery partner:", d.courierName),
        detailLine("Estimated arrival window:", d.deliveryWindow),
      ],
      closing: "Please keep your phone handy in case the delivery agent needs to reach you.",
      buttons: trackShipment(links),
    },
    templateDetails,
    "Out for delivery"
  );
};

// ===========================================================================
// 8. Order Delivered — on_status: Delivered. Per SELLER ORDER.
// ===========================================================================
/**
 * @param {Object} details { orderId, deliveryDate, deliveryTime, items,
 *   orderTotal, ondcOrderId }
 */
exports.osOrderDeliveredTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  // The spec puts the date and time in the intro line, not in the block.
  const intro =
    d.deliveryDate && d.deliveryTime
      ? `Your order was delivered on ${d.deliveryDate} at ${d.deliveryTime}.`
      : d.deliveryDate
        ? `Your order was delivered on ${d.deliveryDate}.`
        : "Your order has been delivered.";

  return page(
    {
      name,
      intro,
      lines: [detailLine("Order ID:", d.orderId)],
      extra: orderSummary(d.items, d.orderTotal),
      buttons: trackShipment(links),
    },
    templateDetails,
    "Order delivered"
  );
};

// ===========================================================================
// 9. Delivery Delayed / ETA Changed. Per SELLER ORDER.
// ===========================================================================
/**
 * @param {Object} details { orderId, oldEta, newEta, delayReason, items,
 *   orderTotal, ondcOrderId }
 */
exports.osDeliveryDelayedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  return page(
    {
      name,
      intro: "We&rsquo;re sorry &mdash; your order is taking a little longer than expected.",
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Previous estimate:", d.oldEta),
        detailLine("New estimate:", d.newEta),
        detailLine("Reason:", d.delayReason),
      ],
      extra: orderSummary(d.items, d.orderTotal),
      // Two of the three triggers (an LSP exception, and the seller going quiet
      // past its promise) carry no revised date at all.
      closing: d.newEta
        ? "We&rsquo;ll keep you posted if anything changes. Thanks for your patience."
        : "We don&rsquo;t have a revised date from the seller yet. We&rsquo;re chasing it and will email you as soon as we know more.",
      buttons: trackShipment(links),
    },
    templateDetails,
    "New delivery estimate"
  );
};

// ===========================================================================
// 10. Cancellation Confirmation (buyer-initiated). Per SELLER ORDER.
// ===========================================================================
/**
 * Matches the Figma design exactly (per explicit approval) - a v2 admin-template
 * style card, not the ONDC shell's plain-text layout every other template in this
 * file uses. Only `details.orderId` is rendered; the other ONDC-era fields
 * (cancellationDate, cancellationReason, refundAmount, items, orderTotal, etc.)
 * are accepted but intentionally unused, so the call site needs no changes.
 * @param {Object} details { orderId }
 */
exports.osCancelledByBuyerTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const website = (templateDetails && templateDetails.baseUrl) || "https://in.peko.one";
  const logo = templateDetails && templateDetails.logo;
  const branding = (templateDetails && templateDetails.branding) || "Peko";
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: "0 16px" }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Order cancelled</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Order cancelled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">${v2RejectBadge()}</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Order cancelled</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Your office supplies order (${d.orderId || ""}) has been cancelled as per your request. We understand that circumstances may change. Kindly note that we have initiated the refund process. You will receive a full refund of the payment within 7 to 10 business days.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for using ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br />Team ${branding}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

// ===========================================================================
// 11. Order Cancelled by Seller — with reason. Per SELLER ORDER.
// ===========================================================================
/**
 * Matches the Figma design exactly (per explicit approval), the same v2
 * admin-template style as osCancelledByBuyerTemplate above - not the ONDC
 * shell's plain-text layout every other template in this file uses. None of
 * the ONDC-era detail fields (sellerName, cancellationReason, refundAmount,
 * items, orderTotal, etc.) are rendered; they're accepted but unused, so the
 * call site needs no changes.
 * @param {Object} details (unused - kept for call-site compatibility)
 */
exports.osCancelledBySellerTemplate = (name, details, templateDetails) => {
  const website = (templateDetails && templateDetails.baseUrl) || "https://in.peko.one";
  const logo = templateDetails && templateDetails.logo;
  const branding = (templateDetails && templateDetails.branding) || "Peko";
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: "0 16px" }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Your order has been cancelled</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Your order has been cancelled" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">${v2RejectBadge()}</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Your order has been cancelled</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Your recent office supplies order has been cancelled from seller side. We apologise for any inconvenience caused. We have initiated the refund process for your order. You will receive a full refund on the payment within 3-5 business days.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">For any enquiry or further assistance, reach out to us at reach@peko.one.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for choosing Peko for your office supply needs. We value your business and hope to serve you again in the future.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;text-align:left;color:#000000;">Regards,<br />Team Peko</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

// ===========================================================================
// 12. Refund Initiated. Per SELLER ORDER.
// ===========================================================================
/**
 * Rebuilt to match the "Bank refund Success" "Peko Emails 2.0" Figma design
 * exactly (per explicit approval), rather than the ONDC shell's plain-text
 * style every other template in this file uses — same exception precedent as
 * osOrderConfirmedTemplate/osCancelledByBuyerTemplate above. Figma shows only
 * name + amount in one paragraph; the order-specific detail lines this
 * function used to render (Order ID, Refund to, timeline, item table, Track
 * Shipment button) are dropped, not just restyled, to match it precisely.
 *
 * @param {Object} details { refundAmount }
 */
exports.osRefundInitiatedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const branding = (templateDetails && templateDetails.branding) || "Peko";
  const website = (templateDetails && templateDetails.baseUrl) || "https://in.peko.one";
  const logo = templateDetails && templateDetails.logo;
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: "0 16px" }), branding });

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Refund processed successfully</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Refund processed successfully" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">
${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">${v2SuccessBadge()}</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Refund processed successfully</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that your refund has been processed successfully. The refund amount (${money(d.refundAmount) || d.refundAmount}) will be credited to your original payment method within 7 to 10 business days.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">We appreciate your understanding and patience.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:16px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for using ${branding}.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="font-family:${V2_FONT};font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br>Team ${branding}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
${footer}
      </div>
    </body>
  </html>`;
};

// ===========================================================================
// 13. Refund Processed / Credited. Per SELLER ORDER.
// ===========================================================================
/**
 * Also lives in paymentGateway (utils/emailTemplate/officeSuppliesPayment.js),
 * which is where the Cashfree refund webhook can reach it. Keep the two in step.
 *
 * @param {Object} details { orderId, refundAmount, creditedTo, refundReferenceId,
 *   refundCreditedDate, items, orderTotal, ondcOrderId }
 */
exports.osRefundCreditedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });

  return page(
    {
      name,
      intro: "Your refund has been processed and credited.",
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Refund amount:", money(d.refundAmount) || d.refundAmount),
        detailLine("Credited to:", d.creditedTo),
        detailLine("Reference number:", d.refundReferenceId),
        detailLine("Date credited:", d.refundCreditedDate),
      ],
      extra: orderSummary(d.items, d.orderTotal),
      closing: "It may take a couple of days to reflect in your statement depending on your bank.",
      buttons: trackShipment(links),
    },
    templateDetails,
    "Refund credited"
  );
};

// ===========================================================================
// 14. Return Pickup Scheduled. Per SELLER ORDER.
// ===========================================================================
/**
 * @param {Object} details { orderId, returnItems, pickupDate, pickupWindow,
 *   items, orderTotal, ondcOrderId }
 *
 * Sends even when no slot came through: the news is that the return was APPROVED.
 * Most DigiDukaan sellers never populate the pickup range, so the slotless form
 * is the common one, not the exception — and the two slot lines drop themselves.
 */
exports.osReturnPickupScheduledTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const links = officeSuppliesLinks(templateDetails, { ondcOrderId: d.ondcOrderId });
  const hasSlot = Boolean(d.pickupDate || d.pickupWindow);

  return page(
    {
      name,
      intro: hasSlot
        ? "Your return request has been approved. Here are the pickup details:"
        : "Your return request has been approved.",
      lines: [
        detailLine("Order ID:", d.orderId),
        detailLine("Item(s) to return:", d.returnItems),
        detailLine("Pickup date:", d.pickupDate),
        detailLine("Pickup time window:", d.pickupWindow),
      ],
      extra: orderSummary(d.items, d.orderTotal),
      closing: hasSlot
        ? "Please keep the item in its original packaging with all tags and accessories ready for pickup."
        : "The seller will confirm a pickup slot shortly. Please keep the item in its original packaging with all tags and accessories ready.",
      buttons: trackShipment(links),
    },
    templateDetails,
    hasSlot ? "Pickup scheduled" : "Return approved"
  );
};

// ===========================================================================
// 15. Return Completed → Refund / Replacement Processed. Per SELLER ORDER.
// ===========================================================================
/**
 * Matches the Figma design as closely as the available order data allows (per
 * explicit approval) - the same v2 admin-template style as
 * osCancelledByBuyerTemplate/osCancelledBySellerTemplate above, not the ONDC
 * shell's plain-text layout every other template in this file uses.
 *
 * One thing Figma shows that this does NOT render: a separate "Shipping &
 * handling" line above Grand Total. There's no reliable per-return shipping
 * charge in the order data to show there, and a guessed figure would be worse
 * than omitting it - Grand Total is just the sum of the item rows.
 *
 * @param {Object} details { orderId, placedOn, pickupAddress, mobile, remarks,
 *   items: [{productName, quantity, price}], isReplacement, refundAmount,
 *   refundTimeline, sellerName, resolutionType, resolutionDetail, returnItems,
 *   ondcOrderId } - the last five are accepted but unused, kept for call-site
 *   compatibility.
 */
exports.osReturnCompletedTemplate = (name, details, templateDetails) => {
  const d = details || {};
  const website = (templateDetails && templateDetails.baseUrl) || "https://in.peko.one";
  const logo = templateDetails && templateDetails.logo;
  const branding = (templateDetails && templateDetails.branding) || "Peko";
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { size: 24, padding: "0 16px" }), branding });

  const timeline = d.refundTimeline || REFUND_TIMELINE_TEXT;
  const amount = money(d.refundAmount);

  // The spec states both branches in one sentence. We know which one applies, so
  // the irrelevant half is dropped rather than asking the buyer to work it out.
  const isReplacement = Boolean(d.isReplacement) || String(d.resolutionType || "").toLowerCase() === "replacement";
  const refundParagraph = isReplacement
    ? "Your replacement will ship separately and you&rsquo;ll receive a shipping update shortly."
    : `Your refund${amount ? ` of ${amount}` : ""} for the returned items will be credited to your original payment method within ${timeline}. Kindly note that the exact timeframe for the refund to reflect in your account may vary based on your financial institution&rsquo;s processing procedures.`;

  const font = "font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;";
  const detailRows = [
    ["Order", d.orderId],
    ["Placed on", d.placedOn],
    ["Pick Up Address", d.pickupAddress],
    ["Mobile Number", d.mobile],
    ["Remarks", d.remarks],
  ].filter(([, value]) => value);
  const detailRowsHtml = detailRows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;${font}font-size:14px;color:#6B7280;vertical-align:top;white-space:nowrap;">${label}</td><td style="padding:4px 0;${font}font-size:14px;color:#000000;">${value}</td></tr>`
    )
    .join("");

  const items = (Array.isArray(d.items) ? d.items : []).filter((item) => item && item.productName);
  const itemRowsHtml = items
    .map((item) => {
      const qty = item.quantity || 1;
      const unitPrice = money(item.price);
      const lineTotal = item.price != null ? money(Number(item.price) * qty) : null;
      return `<tr>
        <td style="padding:8px;border:1px solid #E5E7EB;${font}font-size:14px;color:#000000;">${item.productName}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:right;${font}font-size:14px;color:#000000;">${unitPrice || "&mdash;"}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:center;${font}font-size:14px;color:#000000;">${qty}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:right;${font}font-size:14px;color:#000000;">${lineTotal || "&mdash;"}</td>
      </tr>`;
    })
    .join("");
  const productTableHtml = items.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="padding:8px;border:1px solid #E5E7EB;background:#F9FAFB;${font}font-size:12px;font-weight:700;color:#6B7280;">PRODUCT NAME</td>
          <td style="padding:8px;border:1px solid #E5E7EB;background:#F9FAFB;text-align:right;${font}font-size:12px;font-weight:700;color:#6B7280;">UNIT PRICE</td>
          <td style="padding:8px;border:1px solid #E5E7EB;background:#F9FAFB;text-align:center;${font}font-size:12px;font-weight:700;color:#6B7280;">QUANTITY</td>
          <td style="padding:8px;border:1px solid #E5E7EB;background:#F9FAFB;text-align:right;${font}font-size:12px;font-weight:700;color:#6B7280;">TOTAL AMOUNT</td>
        </tr>
        ${itemRowsHtml}
        ${amount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #E5E7EB;text-align:right;font-weight:700;${font}font-size:14px;color:#000000;">Grand Total</td><td style="padding:8px;border:1px solid #E5E7EB;text-align:right;font-weight:700;${font}font-size:14px;color:#000000;">${amount}</td></tr>` : ""}
      </table>`
    : "";

  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>Returned item(s) accepted</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="Returned item(s) accepted" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">${v2SuccessBadge()}</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="${font}font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">Returned item(s) accepted.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">Dear ${name},</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">We are pleased to inform you that your returned item(s) have been inspected and accepted. We have initiated the refund process.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">${refundParagraph}</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">We appreciate your understanding and patience.</div>
                                </td>
                              </tr>
                              ${
                                detailRowsHtml
                                  ? `<tr>
                                <td align="left" style="font-size:0px;padding-bottom:8px;word-break:break-word;">
                                  <div style="${font}font-size:18px;font-weight:700;line-height:1.4;text-align:left;color:#000000;">Order Details</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:24px;word-break:break-word;">
                                  <table role="presentation" cellpadding="0" cellspacing="0">${detailRowsHtml}</table>
                                </td>
                              </tr>`
                                  : ""
                              }
                              ${
                                productTableHtml
                                  ? `<tr>
                                <td align="left" style="font-size:0px;padding-bottom:32px;word-break:break-word;">
                                  ${productTableHtml}
                                </td>
                              </tr>`
                                  : ""
                              }
                              <tr>
                                <td align="left" style="font-size:0px;padding-bottom:20px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">Thank you for using Peko.</div>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-size:0px;word-break:break-word;">
                                  <div style="${font}font-size:16px;line-height:1.6;text-align:left;color:#000000;">Best Regards,<br />Team Peko</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

// ===========================================================================
// Subjects — the spec's, verbatim. The `- revise` / `- revised` marks the PDF
// appends to 8 and 11 are editorial notes and are deliberately absent.
// ===========================================================================
const subjects = {
  orderConfirmed: (orderIds) => {
    const ids = idList(orderIds);
    return `Order Confirmed - Your order has been successfully placed. Order ID ${ids}.`;
  },
  orderAccepted: (sellerName, orderId) =>
    `${sellerName || "The seller"} has accepted your order #${orderId}`,
  orderShipped: (orderId) => `Your order #${orderId} is on its way`,
  outForDelivery: (orderId) => `Arriving today: order #${orderId} is out for delivery`,
  orderDelivered: (orderId) => `Delivered! Order #${orderId} has arrived`,
  deliveryDelayed: (orderId) => `Update on your order #${orderId} — new delivery estimate`,
  cancelledByBuyer: (orderId) => `Order #${orderId} has been cancelled`,
  cancelledBySeller: (orderId) => `We're sorry — order #${orderId} was cancelled by the seller`,
  refundInitiated: (orderId) => `Refund initiated for order #${orderId}`,
  refundCredited: (refundAmount, orderId) =>
    `${money(refundAmount) || refundAmount} refunded for order #${orderId}`,
  // The slotless form is the common one (most sellers never send a pickup range),
  // and a subject promising a schedule the body doesn't contain reads as a bug.
  returnPickupScheduled: (orderId, hasSlot = true) =>
    hasSlot
      ? `Pickup scheduled for your return — order #${orderId}`
      : `Your return for order #${orderId} has been approved`,
  returnCompleted: (orderId) => `Your return for order #${orderId} is complete`,
};

exports.subjects = subjects;
exports.REFUND_TIMELINE_DAYS = REFUND_TIMELINE_DAYS;
exports.REFUND_TIMELINE_TEXT = REFUND_TIMELINE_TEXT;

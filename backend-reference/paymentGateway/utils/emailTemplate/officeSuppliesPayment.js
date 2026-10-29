/**
 * Office Supplies (ONDC) — spec template 13 (Refund Processed / Credited).
 *
 * This file used to carry three templates. The 2026-08-24 spec revision deleted
 * 2 (Payment Receipt) and 3 (Payment Failed): the receipt's four lines were folded
 * into the Order Confirmation mail, which purchase owns, and payment failure now
 * sends nothing at all. Only 13 remains here, because it fires on the Cashfree
 * REFUND_STATUS_WEBHOOK, which lands in this service.
 *
 * ------------------------------------------------------------------------------
 * THIS IS A COPY. Origin: purchase/utils/emailTemplate/ondcShell.js and
 * purchase/utils/emailTemplate/officeSuppliesNotifications.js.
 * ------------------------------------------------------------------------------
 * The services deploy separately with their own node_modules, so a cross-service
 * require is not available. Rather than an internal HTTP hop for an email, the
 * chrome is duplicated here — the same call the repo already makes for
 * utils/emailTemplates/officeSupplies.js.
 *
 * The cost of a copy is drift, so it is fenced: everything shared lives in this
 * ONE file (no second copy anywhere in this service). If you change the chrome,
 * change it in purchase first, then mirror it here.
 *
 * ==============================================================================
 * THE DESIGN IS TRANSCRIBED, NOT CHOSEN.
 * Copy and structure: a.pdf (revised 2026-08-24).
 * Visual design: "Office_Supplies_Email_Templates", Google Docs id
 * 1hszk0WLWN7uNI0Qh1GCBXiEouurJSfTmI4o-dhGUQ-E, measured off its HTML export.
 * ==============================================================================
 * Palette (the complete set — no other colour appears in the design):
 *   #171717 body · #8c8c8c muted · #ff4f4f accent (button fill, Order Total)
 *   #ffffff on-accent + content bg · #f5f5f5 table header · #efefef image cell
 *   #e0e0e0 1pt rules
 * Body 10pt weight 400. No hero icon, no large heading — the body begins at
 * "Hi {{customer_name}},". The CTA is ONE solid red block. Units are pt, as the
 * design specifies them.
 */

// ---------------------------------------------------------------------------
// Chrome — mirrored from purchase/utils/emailTemplate/ondcShell.js
// ---------------------------------------------------------------------------

const FONT = "Arial,Helvetica,sans-serif";

const COLORS = {
    body: "#171717",
    muted: "#8c8c8c",
    accent: "#ff4f4f",
    onAccent: "#ffffff",
    headerFill: "#f5f5f5",
    imageFill: "#efefef",
    rule: "#e0e0e0",
};

const ondcEmailShell = (title, templateDetails, innerHtml) => {
    const year = new Date().getUTCFullYear();
    const logo = templateDetails && templateDetails.logo;
    const appUrl = (templateDetails && templateDetails.baseUrl) || "https://peko.one/in";
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f2f4f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:24px 12px;font-family:${FONT};">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <!-- header -->
  <tr><td style="padding:8px 20px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" style="vertical-align:middle;">${logo
          ? `<img src="${logo}" alt="Peko" height="30" style="height:30px;display:block;border:0;">`
          : `<span style="font-size:24px;font-weight:800;color:#111827;">Peko</span>`}</td>
      <td align="right" style="vertical-align:middle;font-size:13px;color:#667085;"><a href="${appUrl}" style="color:#667085;text-decoration:none;">www.peko.one</a></td>
    </tr></table>
  </td></tr>
  <!-- content card -->
  <tr><td style="background:#ffffff;border-radius:20px;padding:36px 40px;">${innerHtml}</td></tr>
  <!-- footer -->
  <tr><td align="center" style="padding:28px 24px;color:#667085;font-size:13px;line-height:1.6;">
    <div style="margin-bottom:14px;">
      <a href="https://x.com/PekoIndia" style="color:#667085;text-decoration:none;margin:0 8px;">X</a>·
      <a href="https://www.instagram.com/peko.india" style="color:#667085;text-decoration:none;margin:0 8px;">Instagram</a>·
      <a href="https://www.linkedin.com/company/pekoindia" style="color:#667085;text-decoration:none;margin:0 8px;">LinkedIn</a>
    </div>
    <!-- The support sentence that used to sit here is gone on purpose: the spec
         moved it into the body, where signOff() renders it. Two support
         addresses in one email is worse than one. -->
    <div style="color:#98a2b3;margin-bottom:16px;">&copy; ${year} Peko Platforms Private Limited, All Rights Reserved</div>
    <div style="font-weight:600;color:#475156;margin-bottom:10px;">Download the app</div>
    <div>
      <a href="${appUrl}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:9px 16px;border-radius:8px;margin:0 4px;">Google Play</a>
      <a href="${appUrl}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:9px 16px;border-radius:8px;margin:0 4px;">App Store</a>
    </div>
  </td></tr>
</table>
</td></tr></table></body></html>`;
};

// Must stay byte-identical to purchase's officeSuppliesLinks.
const OFFICE_SUPPLIES_BASE = "/office-supplies";
const ORDER_HISTORY_PATH = `${OFFICE_SUPPLIES_BASE}/order-history`;

const officeSuppliesLinks = (templateDetails, { ondcOrderId } = {}) => {
    const base = String((templateDetails && templateDetails.baseUrl) || "https://in.peko.one").replace(/\/+$/, "");
    return {
        track: ondcOrderId ? `${base}${ORDER_HISTORY_PATH}/order-details/${ondcOrderId}` : null,
        manage: `${base}${ORDER_HISTORY_PATH}`,
        cart: `${base}${OFFICE_SUPPLIES_BASE}/cart`,
    };
};

const bodyPara = (html, gap = 8) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:400;color:${COLORS.body};text-align:left;line-height:1.45;">${html}</p>`
        : "";

const mutedPara = (html, gap = 8) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:400;color:${COLORS.muted};text-align:left;line-height:1.45;">${html}</p>`
        : "";

const strongPara = (html, gap = 4) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.body};text-align:left;line-height:1.45;">${html}</p>`
        : "";

const spacer = (pt = 8) => `<div style="font-size:0;line-height:0;height:${pt}pt;">&nbsp;</div>`;

/** Plain "Label: value" text — the document writes these as ordinary body lines. */
const detailLine = (label, value) => (value ? `${label} ${value}` : "");

const detailBlock = (lines) => {
    const present = (Array.isArray(lines) ? lines : []).filter(Boolean);
    if (!present.length) return "";
    return present
        .map((line, index) => bodyPara(line, index === present.length - 1 ? 8 : 1))
        .join("");
};

/** A CTA cell: a solid red block filling its half of the row. */
const ctaButton = (label, href, width = "48.5%") =>
    `<td width="${width}" style="width:${width};background-color:${COLORS.accent};padding:7pt 5pt;text-align:center;vertical-align:middle;mso-padding-alt:7pt 5pt;">` +
    (href
        ? `<a href="${href}" style="display:block;font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.onAccent};text-decoration:none;">${label}</a>`
        : `<span style="font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.onAccent};">${label}</span>`) +
    `</td>`;

/**
 * The CTA row — takes a LIST, mirroring purchase's ctaRow, because the revised
 * spec makes the count per-template. Template 13 carries one button.
 *
 * @param {Array<{label: string, href: string}>} buttons
 */
const ctaRow = (buttons = []) => {
    const usable = (Array.isArray(buttons) ? buttons : []).filter((b) => b && b.label && b.href);
    if (!usable.length) return "";
    const spacerCell = `<td width="3%" style="width:3%;font-size:0;line-height:0;">&nbsp;</td>`;
    const cells = usable.map((b) => ctaButton(b.label, b.href)).join(spacerCell);
    const filler = usable.length === 1 ? `<td style="font-size:0;line-height:0;">&nbsp;</td>` : "";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0;">
<tr>${cells}${filler}</tr>
</table>`;
};

/**
 * The spec's four-line closing block. The support address lives here now
 * (reach@peko.one), which is why the shell footer above no longer repeats one.
 */
const signOff = () =>
    [
        bodyPara("Thank you for shopping with us.", 1),
        mutedPara(
            'If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:' +
                COLORS.body +
                ';text-decoration:underline;">reach@peko.one</a>. We assure you of our best services at all times.',
            8
        ),
        bodyPara("Best Regards,", 1),
        strongPara("Team Peko", 0),
    ].join("");

// The item table — added to template 13 by the revision. Geometry, fills and
// rules mirror purchase's itemTable exactly.
const COL = { image: "14.3%", name: "44.7%", qty: "17.6%", price: "23.4%" };
const CELL_RULE = `1pt solid ${COLORS.rule}`;

const headerCell = (label, align, width) =>
    `<td width="${width}" align="${align}" style="width:${width};border:${CELL_RULE};background-color:${COLORS.headerFill};padding:5pt;text-align:${align};vertical-align:top;font-family:${FONT};font-size:8pt;font-weight:700;color:${COLORS.muted};">${label}</td>`;

const itemImageCell = (image) =>
    `<td width="${COL.image}" align="center" style="width:${COL.image};border:${CELL_RULE};background-color:${COLORS.imageFill};padding:7pt 3pt;text-align:center;vertical-align:middle;">` +
    (image
        ? `<img src="${image}" alt="" width="44" style="width:44px;max-width:100%;height:auto;display:inline-block;border:0;">`
        : `&nbsp;`) +
    `</td>`;

const itemTable = (rows, { total } = {}) => {
    const items = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!items.length) return "";

    const head = `<tr>${headerCell("ITEM IMAGE", "center", COL.image)}${headerCell("ITEM NAME", "left", COL.name)}${headerCell("QTY", "center", COL.qty)}${headerCell("ITEM PRICE", "right", COL.price)}</tr>`;

    const cell = (html, align, width) =>
        `<td width="${width}" align="${align}" style="width:${width};border:${CELL_RULE};padding:7pt 5pt;text-align:${align};vertical-align:middle;font-family:${FONT};font-size:9.5pt;color:${COLORS.body};">${html}</td>`;

    const body = items
        .map(
            (item) =>
                `<tr>${itemImageCell(item.image)}${cell(item.productName || "Item", "left", COL.name)}${cell(item.quantity || 1, "center", COL.qty)}${cell(money(item.price) || "&mdash;", "right", COL.price)}</tr>`
        )
        .join("");

    const totalRow = money(total)
        ? `<tr>
<td colspan="3" align="right" style="border-top:${CELL_RULE};padding:7pt 5pt 5pt;text-align:right;vertical-align:top;font-family:${FONT};font-size:9.5pt;font-weight:700;color:${COLORS.body};">Order Total</td>
<td width="${COL.price}" align="right" style="width:${COL.price};border-top:${CELL_RULE};padding:7pt 5pt 5pt;text-align:right;vertical-align:top;font-family:${FONT};font-size:9.5pt;font-weight:700;color:${COLORS.accent};">${money(total)}</td>
</tr>`
        : "";

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 8pt 0;">${head}${body}${totalRow}</table>`;
};

/** The item table under its "Order summary:" label, or "" when there are no rows. */
const orderSummary = (items, total) => {
    const table = itemTable(items, { total });
    return table ? `${strongPara("Order summary:")}${table}` : "";
};

// No space after the symbol: the document writes "₹{{amount_paid}}". null/""/
// undefined are rejected before Number(), which would turn them into 0.
const money = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value);
    return Number.isFinite(amount)
        ? `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : null;
};

const asDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const dateIST = (value) => {
    const date = asDate(value);
    return date
        ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
        : null;
};

const timeIST = (value) => {
    const date = asDate(value);
    return date
        ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
        : null;
};

const dateTimeIST = (value) => {
    const date = dateIST(value);
    return date ? `${date}, ${timeIST(value)}` : null;
};

const REFUND_TIMELINE_TEXT = "5–7 business days";

/** The spec's body shape, identical to purchase's `page`. */
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
        signOff(),
    ]
        .filter(Boolean)
        .join("");
    return ondcEmailShell(title, templateDetails, inner);
};

// ===========================================================================
// 13. Refund Processed / Credited — per SELLER ORDER.
//
// The only template left in this service. Templates 2 and 3 lived here until the
// 2026-08-24 revision deleted them; see the file header.
// ===========================================================================
/**
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
            buttons: [{ label: "Track Shipment", href: links.track || links.manage }],
        },
        templateDetails,
        "Refund credited"
    );
};

/** Subjects — the spec's wording, mirrored from purchase's `subjects`. */
const subjects = {
    refundCredited: (refundAmount, orderId) =>
        `${money(refundAmount) || refundAmount} refunded for order #${orderId}`,
};

exports.subjects = subjects;
exports.officeSuppliesLinks = officeSuppliesLinks;
exports.signOff = signOff;
exports.money = money;
exports.dateTimeIST = dateTimeIST;
exports.COLORS = COLORS;
exports.REFUND_TIMELINE_TEXT = REFUND_TIMELINE_TEXT;

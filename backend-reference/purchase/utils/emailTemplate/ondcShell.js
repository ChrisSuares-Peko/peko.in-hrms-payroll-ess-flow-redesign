/**
 * Shared chrome for every Office Supplies (ONDC) email.
 *
 * ============================================================================
 * THE DESIGN HERE IS NOT A CHOICE. It is transcribed from the spec document
 * "Office_Supplies_Email_Templates" (Google Docs id
 * 1hszk0WLWN7uNI0Qh1GCBXiEouurJSfTmI4o-dhGUQ-E), measured off its HTML export.
 * ============================================================================
 *
 * Palette — the COMPLETE set; no other colour appears anywhere in the document:
 *
 *   #171717  body text (every line, weight 400)
 *   #8c8c8c  muted text — soft closing lines, the sign-off's first line,
 *            item-table header labels, the image-cell placeholder
 *   #ff4f4f  the single accent — button fill, and the Order Total amount
 *   #ffffff  button labels, and the content cell's background
 *   #f5f5f5  item-table header row fill
 *   #efefef  item-table image-cell fill
 *   #e0e0e0  1pt rules, all four sides of every item-table cell
 *
 * Units are pt, as the document specifies them — converting to px would only
 * introduce rounding drift against the source. Body 10pt, table cells 9.5pt,
 * table header labels 8pt bold.
 *
 * There is deliberately NO hero icon and NO large coloured heading: the document's
 * body begins at "Hi {{customer_name}},". Earlier versions of this file invented
 * both, plus a green/blue/amber accent per template state. All of that is gone.
 *
 * The document's TRIGGER / SUBJECT rows and its numbered section headings are
 * document chrome, not email content, and are not rendered.
 *
 * Everything below is a pure function — no DB, no I/O, no throwing. A template
 * is rendered on fire-and-forget notify paths where an exception would be
 * swallowed into a missing email, so "return empty" always beats "throw".
 */

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

/**
 * A body paragraph. `gap` is the document's padding-bottom for this line:
 * 8pt closes a block, 1pt keeps consecutive detail lines tight together.
 */
const bodyPara = (html, gap = 8) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:400;color:${COLORS.body};text-align:left;line-height:1.45;">${html}</p>`
        : "";

/** The same paragraph in the muted grey the document uses for soft lines. */
const mutedPara = (html, gap = 8) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:400;color:${COLORS.muted};text-align:left;line-height:1.45;">${html}</p>`
        : "";

/** A bold body line, e.g. the document's "Order summary:" label. */
const strongPara = (html, gap = 4) =>
    html
        ? `<p style="margin:0;padding:0 0 ${gap}pt 0;font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.body};text-align:left;line-height:1.45;">${html}</p>`
        : "";

/** Vertical whitespace, in the document's pt. */
const spacer = (pt = 8) =>
    `<div style="font-size:0;line-height:0;height:${pt}pt;">&nbsp;</div>`;

/**
 * One "Label: value" line — a PLAIN paragraph, not a table row. The document
 * writes these as ordinary body text ("Order ID: {{order_id}}") with no bold
 * label and no second column.
 *
 * Returns "" when the value is empty, which is what lets a template omit a line
 * it has no data for (an absent AWB, an unknown pickup slot) instead of printing
 * a placeholder. Pass through detailBlock to get the document's line rhythm.
 */
const detailLine = (label, value) => (value ? `${label} ${value}` : "");

/**
 * A run of detail lines with the document's spacing: 1pt between them, 8pt after
 * the last one. Empty lines are dropped first, so the gap always lands on the
 * last line that actually rendered.
 */
const detailBlock = (lines) => {
    const present = (Array.isArray(lines) ? lines : []).filter(Boolean);
    if (!present.length) return "";
    return present
        .map((line, index) => bodyPara(line, index === present.length - 1 ? 8 : 1))
        .join("");
};

/**
 * Shared email chrome (Peko header + footer) around a white content card.
 * @param {string} title <title> text
 * @param {Object} templateDetails { logo, branding, baseUrl }
 * @param {string} innerHtml the card's inner body
 */
const ondcEmailShell = (title, templateDetails, innerHtml) => {
    const year = new Date().getUTCFullYear();
    const logo = templateDetails && templateDetails.logo;
    const appUrl = (templateDetails && templateDetails.baseUrl) || "https://www.peko.one";
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f2f4f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
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

// ---------------------------------------------------------------------------
// Deep links
// ---------------------------------------------------------------------------

/**
 * The ONE place the office-supplies URL shape lives. Pinned by
 * utils/__tests__/ondcEmailLinks.test.js against the live frontend routes
 * (Peko-IN-Frontend/src/routes/sections/officeSupplies.tsx + the RELATIVE
 * paths.officeSupplies block).
 *
 * Do NOT copy these from the frontend's `paths.dashboard` block: its
 * office-supplies entries are stale and referenced nowhere — they carry an
 * "/office-supples/" typo and "carts" where the live segment is "cart".
 *
 * `track` needs the ondcOrders row id; without one (the payment mails, which
 * fire before any order row exists) only `manage` and `cart` are available.
 */
const OFFICE_SUPPLIES_BASE = "/office-supplies";
const ORDER_HISTORY_PATH = `${OFFICE_SUPPLIES_BASE}/order-history`;

// A real partner has exactly one baseUrl (no staging/production split exists
// for partner domains), so it always wins when present. Peko's own
// staging-vs-production split only applies to the no-partner fallback.
const officeSuppliesLinks = (templateDetails, { ondcOrderId } = {}) => {
    const base = String(
        (templateDetails && templateDetails.baseUrl) ||
            (process.env.NODE_ENV === "staging" ? process.env.FRONTEND_STAGING_URL : "https://in.peko.one")
    ).replace(/\/+$/, "");
    return {
        track: ondcOrderId ? `${base}${ORDER_HISTORY_PATH}/order-details/${ondcOrderId}` : null,
        manage: `${base}${ORDER_HISTORY_PATH}`,
        cart: `${base}${OFFICE_SUPPLIES_BASE}/cart`,
    };
};

/**
 * One CTA cell: a SOLID RED BLOCK, not a pill.
 *
 * The document draws each button as a table cell filled #ff4f4f, 220.5pt wide,
 * padded 7pt 5pt, with its label centred in white bold. It is a mockup so it
 * carries no hrefs; here the label is wrapped in an <a> that fills the cell, so
 * the whole block is clickable in every client. `display:block` on the anchor is
 * what makes Outlook treat the padding as part of the link.
 */
const ctaButton = (label, href, width = "48.5%") =>
    `<td width="${width}" style="width:${width};background-color:${COLORS.accent};padding:7pt 5pt;text-align:center;vertical-align:middle;mso-padding-alt:7pt 5pt;">` +
    (href
        ? `<a href="${href}" style="display:block;font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.onAccent};text-decoration:none;">${label}</a>`
        : `<span style="font-family:${FONT};font-size:10pt;font-weight:700;color:${COLORS.onAccent};">${label}</span>`) +
    `</td>`;

/**
 * The two-button block every one of the 15 templates ends with: Track Shipment
 * and Manage Orders side by side, separated by the document's 12pt spacer cell.
 *
 * The CTA row. Takes a LIST, because the revised spec makes the button count
 * per-template: one on almost everything, two only on Return Completed.
 *
 * A single button keeps the same 48.5% block size as one half of a pair, so a
 * one-button and a two-button mail read as the same system rather than one
 * looking stretched. Buttons with no href are dropped; an empty list renders "".
 *
 * @param {Array<{label: string, href: string}>} buttons
 */
const ctaRow = (buttons = []) => {
    const usable = (Array.isArray(buttons) ? buttons : []).filter((b) => b && b.label && b.href);
    if (!usable.length) return "";
    const spacerCell = `<td width="3%" style="width:3%;font-size:0;line-height:0;">&nbsp;</td>`;
    const cells = usable.map((b) => ctaButton(b.label, b.href)).join(spacerCell);
    // A trailing filler cell keeps a lone button at 48.5% instead of letting the
    // table stretch it across the full width.
    const filler = usable.length === 1 ? `<td style="font-size:0;line-height:0;">&nbsp;</td>` : "";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0;">
<tr>${cells}${filler}</tr>
</table>`;
};

/**
 * The spec's closing block — four lines, replacing the old two-line sign-off.
 *
 * The support address moved INTO the body here (reach@peko.one), so the shell's
 * footer no longer repeats its own support sentence; see ondcEmailShell.
 */
const signOff = (branding) =>
    [
        bodyPara("Thank you for shopping with us.", 1),
        mutedPara(
            'If you have any queries or need further assistance, please reach out to us at <a href="mailto:reach@peko.one" style="color:' +
                COLORS.body +
                ';text-decoration:underline;">reach@peko.one</a>. We assure you of our best services at all times.',
            8
        ),
        bodyPara("Best Regards,", 1),
        strongPara(`Team ${branding || "Peko"}`, 0),
    ].join("");

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * "₹1,150.00", or null when there is no number to show (so the line is dropped).
 *
 * No space after the symbol: the document writes "₹{{item_1_price}}" throughout.
 *
 * null/""/undefined are rejected BEFORE Number(), because Number(null) and Number("")
 * are both 0 — an unknown refund amount would otherwise render as a confident
 * "₹0.00", which is worse than an absent line.
 */
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

/** "20 August 2026" */
const dateIST = (value) => {
    const date = asDate(value);
    return date
        ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })
        : null;
};

/** "09:30 PM" */
const timeIST = (value) => {
    const date = asDate(value);
    return date
        ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
        : null;
};

/** "20 August 2026, 09:30 PM" */
const dateTimeIST = (value) => {
    const date = dateIST(value);
    return date ? `${date}, ${timeIST(value)}` : null;
};

// ---------------------------------------------------------------------------
// Item table
// ---------------------------------------------------------------------------

// The document's column geometry: 64.7 / 202.3 / 79.8 / 106.2pt of a 453pt table.
const COL = { image: "14.3%", name: "44.7%", qty: "17.6%", price: "23.4%" };
const CELL_RULE = `1pt solid ${COLORS.rule}`;

const headerCell = (label, align, width) =>
    `<td width="${width}" align="${align}" style="width:${width};border:${CELL_RULE};background-color:${COLORS.headerFill};padding:5pt;text-align:${align};vertical-align:top;font-family:${FONT};font-size:8pt;font-weight:700;color:${COLORS.muted};">${label}</td>`;

/**
 * The image cell. The document can only show the words "{{item_img}}" on an
 * #efefef fill; the real mail puts the product photo on that same fill.
 *
 * A missing image keeps the filled cell rather than showing a broken-image icon:
 * for older orders the catalog row (and its image) is legitimately gone —
 * ondcProductPurge deletes it — so this is the normal path, not an error path.
 */
const itemImageCell = (image) =>
    `<td width="${COL.image}" align="center" style="width:${COL.image};border:${CELL_RULE};background-color:${COLORS.imageFill};padding:7pt 3pt;text-align:center;vertical-align:middle;">` +
    (image
        ? `<img src="${image}" alt="" width="44" style="width:44px;max-width:100%;height:auto;display:inline-block;border:0;">`
        : `&nbsp;`) +
    `</td>`;

/**
 * The document's order-summary table (template 1).
 *
 * Every cell carries a 1pt #e0e0e0 rule on all four sides over a collapsed
 * border, the header row is #f5f5f5 with 8pt muted labels, and the total row is
 * a colspan=3 "Order Total" against the amount in the accent red — that amount is
 * the only red text anywhere in the body.
 *
 * @param {Array} rows [{ productName, quantity, price, image }]
 * @param {Object} [opts] { total, sellerName }
 */
const itemTable = (rows, { total, sellerName } = {}) => {
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

    // Top rule only — the document gives this row no side or bottom borders.
    const totalRow = money(total)
        ? `<tr>
<td colspan="3" align="right" style="border-top:${CELL_RULE};padding:7pt 5pt 5pt;text-align:right;vertical-align:top;font-family:${FONT};font-size:9.5pt;font-weight:700;color:${COLORS.body};">Order Total</td>
<td width="${COL.price}" align="right" style="width:${COL.price};border-top:${CELL_RULE};padding:7pt 5pt 5pt;text-align:right;vertical-align:top;font-family:${FONT};font-size:9.5pt;font-weight:700;color:${COLORS.accent};">${money(total)}</td>
</tr>`
        : "";

    const heading = sellerName ? strongPara(sellerName, 2) : "";

    return `${heading}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 8pt 0;">${head}${body}${totalRow}</table>`;
};

module.exports = {
    COLORS,
    FONT,
    ondcEmailShell,
    officeSuppliesLinks,
    bodyPara,
    mutedPara,
    strongPara,
    spacer,
    detailLine,
    detailBlock,
    ctaButton,
    ctaRow,
    signOff,
    money,
    dateIST,
    timeIST,
    dateTimeIST,
    itemTable,
    ORDER_HISTORY_PATH,
    OFFICE_SUPPLIES_BASE,
};

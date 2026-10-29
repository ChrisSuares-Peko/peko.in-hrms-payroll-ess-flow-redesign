// HTML template for the Detailed P&L comparison PDF (one page per financial year).
// Consumes the shape returned by findDetailedProfitAndLoss: { sections[], summary{} }.

// Indian-grouped rupee formatting, e.g. 10993350 -> "₹1,09,93,350.00".
const formatINR = (n) => {
    const value = Number(n) || 0;
    const neg = value < 0;
    const [intPart, decPart] = Math.abs(value).toFixed(2).split(".");
    const last3 = intPart.length > 3 ? intPart.slice(-3) : intPart;
    let rest = intPart.length > 3 ? intPart.slice(0, -3) : "";
    if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    const grouped = rest ? `${rest},${last3}` : last3;
    return `${neg ? "-" : ""}₹${grouped}.${decPart}`;
};

const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const prettyDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const row = (label, amount, cls = "") =>
    `<div class="row ${cls}"><span class="label">${esc(label)}</span><span class="amount">${formatINR(
        amount
    )}</span></div>`;

// Waterfall subtotal inserted AFTER a given section's total (keyed by section.key).
const WATERFALL_AFTER = {
    cogs: (s) => ({ label: "Gross Profit", amount: s.grossProfit, cls: "subtotal" }),
    operatingExpenses: (s) => ({ label: "Operating Profit", amount: s.operatingProfit, cls: "subtotal" }),
    otherExpenses: (s) => ({ label: "Profit Before Tax", amount: s.profitBeforeTax, cls: "subtotal" }),
    tax: (s) => ({ label: "Net Profit", amount: s.netProfit, cls: "net" }),
};

// Render one financial year's Detailed P&L as a page.
const plPageHtml = ({ fyLabel, periodLabel, sections, summary }) => {
    let body = "";
    sections.forEach((sec) => {
        // The tax section is shown without its own header (Profit Before Tax precedes it).
        if (sec.key !== "tax") body += `<div class="section-head">${esc(sec.title)}</div>`;
        (sec.lineItems || []).forEach((li) => {
            body += row(li.label, li.amount, "item");
        });
        // Section total. Revenue's total is highlighted; the rest are subtotals.
        body += row(sec.totalLabel, sec.total, sec.key === "revenue" ? "total-revenue" : "subtotal");
        const wf = WATERFALL_AFTER[sec.key];
        if (wf) {
            const w = wf(summary);
            body += row(w.label, w.amount, w.cls);
        }
    });

    const subtitle = [fyLabel, periodLabel].filter(Boolean).map(esc).join(" &middot; ");
    return `
    <section class="page">
      <div class="card">
        <div class="title">Detailed Profit &amp; Loss</div>
        <div class="subtitle">${subtitle}</div>
        <div class="statement">${body}</div>
      </div>
    </section>`;
};

// Monochrome: single ink colour (black) on white; emphasis via black borders/weight only.
// Spacing is kept compact so a full statement fits on a single A4 page.
const STYLE = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .card { border: 1px solid #000; border-radius: 8px; padding: 14px 18px; }
  .title { font-size: 16px; font-weight: 700; }
  .subtitle { font-size: 10px; color: #000; margin: 2px 0 10px; }
  .section-head { font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: #000; font-weight: 600; margin: 9px 0 3px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; border-bottom: 1px solid #000; font-size: 12px; }
  .row .amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* Emphasised rows: black outline + bold, no fill. Uniform 1px border throughout. */
  .row.subtotal { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 3px; }
  .row.total-revenue { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 3px; }
  .row.net { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 4px; }
`;

// Full document: selected FY page followed by the prior FY page.
const plComparisonTemplate = ({ current, prior }) => `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${STYLE}</style></head>
  <body>
    ${plPageHtml(current)}
    ${plPageHtml(prior)}
  </body>
</html>`;

// Single-page document: the detailed P&L for one period (same page as the comparison).
const plStatementTemplate = (page) => `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${STYLE}</style></head>
  <body>
    ${plPageHtml(page)}
  </body>
</html>`;

module.exports = { plComparisonTemplate, plStatementTemplate, plPageHtml, formatINR, prettyDate };

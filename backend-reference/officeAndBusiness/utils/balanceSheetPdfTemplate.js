// HTML template for the Balance Sheet PDF (single "as-of" statement, and a two-page
// comparison of the current FY-end vs the prior FY-end). Consumes the `statement`
// shape returned by findBalanceSheet: { assets{}, liabilitiesAndEquity{} }.

const { formatINR, prettyDate } = require("./plComparisonPdfTemplate");

const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

const row = (label, amount, cls = "") =>
    `<div class="row ${cls}"><span class="label">${esc(label)}</span><span class="amount">${formatINR(
        amount
    )}</span></div>`;

const lineItems = (items = []) => items.map((li) => row(li.head, li.amount, "item")).join("");

// Render one as-of Balance Sheet as a page: Assets, then Liabilities & Equity.
const bsPageHtml = ({ fyLabel, periodLabel, statement }) => {
    const { assets, liabilitiesAndEquity: le } = statement;

    let body = `<div class="section-head">Assets</div>`;
    body += `<div class="group-head">Current Assets</div>`;
    body += lineItems(assets.currentAssets);
    body += row("Total Current Assets", assets.totalCurrentAssets, "subtotal");
    body += `<div class="group-head">Non-Current Assets</div>`;
    body += lineItems(assets.nonCurrentAssets);
    body += row("Total Non-Current Assets", assets.totalNonCurrentAssets, "subtotal");
    body += row("Total Assets", assets.totalAssets, "total-revenue");

    body += `<div class="section-head">Liabilities &amp; Equity</div>`;
    body += `<div class="group-head">Current Liabilities</div>`;
    body += lineItems(le.currentLiabilities);
    body += row("Total Current Liabilities", le.totalCurrentLiabilities, "subtotal");
    body += `<div class="group-head">Long-Term Liabilities</div>`;
    body += lineItems(le.longTermLiabilities);
    body += row("Total Long-Term Liabilities", le.totalLongTermLiabilities, "subtotal");
    body += `<div class="group-head">Equity</div>`;
    body += lineItems(le.equity);
    body += row("Total Equity", le.totalEquity, "subtotal");
    body += row("Total Liabilities & Equity", le.totalLiabilitiesAndEquity, "net");

    const subtitle = [fyLabel, periodLabel].filter(Boolean).map(esc).join(" &middot; ");
    return `
    <section class="page">
      <div class="card">
        <div class="title">Balance Sheet</div>
        <div class="subtitle">${subtitle}</div>
        <div class="statement">${body}</div>
      </div>
    </section>`;
};

// Monochrome style, matching the P&L PDF's look.
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
  .group-head { font-size: 9px; color: #000; font-weight: 600; margin: 6px 0 2px; padding-left: 2px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; border-bottom: 1px solid #000; font-size: 12px; }
  .row .amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .row.subtotal { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 3px; }
  .row.total-revenue { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 3px; }
  .row.net { border: 1px solid #000; border-radius: 6px; font-weight: 700; margin-top: 4px; }
`;

// Two-page document: selected FY-end snapshot followed by the prior FY-end snapshot.
const bsComparisonTemplate = ({ current, prior }) => `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${STYLE}</style></head>
  <body>
    ${bsPageHtml(current)}
    ${bsPageHtml(prior)}
  </body>
</html>`;

// Single-page document: the Balance Sheet as of one date (same page as the comparison).
const bsStatementTemplate = (page) => `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${STYLE}</style></head>
  <body>
    ${bsPageHtml(page)}
  </body>
</html>`;

module.exports = { bsComparisonTemplate, bsStatementTemplate, bsPageHtml, prettyDate };

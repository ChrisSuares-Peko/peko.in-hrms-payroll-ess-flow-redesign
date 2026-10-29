// HTML template for the GST Summary export PDF (single landscape page).
// Consumes the shape returned by findGstSummary: { registration, rateBreakup[], filing }.
const { formatINR, prettyDate } = require("./plComparisonPdfTemplate");

const num = (v) => Number(v) || 0;
const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

const COLS = [
    "TAX RATE",
    "TAXABLE AMOUNT",
    "OUTPUT GST",
    "INPUT TAX CREDIT",
    "CGST",
    "SGST",
    "IGST",
    "NET PAYABLE",
];

// Monochrome table: black ink on white, black borders, emphasis via weight only.
const STYLE = `
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card { border: 1px solid #000; border-radius: 8px; padding: 16px 18px; }
  .title { font-size: 18px; font-weight: 700; }
  .subtitle { font-size: 10.5px; color: #000; margin-top: 2px; }
  .section-head { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 700; margin: 14px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #000; padding: 7px 9px; text-align: right; white-space: nowrap; }
  th { text-transform: uppercase; font-size: 9px; letter-spacing: .04em; font-weight: 700; }
  th.rate, td.rate { text-align: left; }
  tr.total td { font-weight: 700; }
  .footer { font-size: 10px; margin-top: 12px; }
`;

const dataRow = (r) => `<tr>
    <td class="rate">${esc(r.rate)}%</td>
    <td>${formatINR(r.taxable)}</td>
    <td>${formatINR(r.outputGst)}</td>
    <td>${formatINR(r.itc)}</td>
    <td>${formatINR(r.cgst)}</td>
    <td>${formatINR(r.sgst)}</td>
    <td>${formatINR(r.igst)}</td>
    <td>${formatINR(r.netPayable)}</td>
  </tr>`;

const gstSummaryTemplate = ({ fyLabel, periodLabel, registration = {}, rateBreakup = [], dueDate }) => {
    const totals = rateBreakup.reduce(
        (t, r) => ({
            taxable: t.taxable + num(r.taxable),
            outputGst: t.outputGst + num(r.outputGst),
            itc: t.itc + num(r.itc),
            cgst: t.cgst + num(r.cgst),
            sgst: t.sgst + num(r.sgst),
            igst: t.igst + num(r.igst),
            netPayable: t.netPayable + num(r.netPayable),
        }),
        { taxable: 0, outputGst: 0, itc: 0, cgst: 0, sgst: 0, igst: 0, netPayable: 0 }
    );

    const totalRow = `<tr class="total">
    <td class="rate">Total</td>
    <td>${formatINR(totals.taxable)}</td>
    <td>${formatINR(totals.outputGst)}</td>
    <td>${formatINR(totals.itc)}</td>
    <td>${formatINR(totals.cgst)}</td>
    <td>${formatINR(totals.sgst)}</td>
    <td>${formatINR(totals.igst)}</td>
    <td>${formatINR(totals.netPayable)}</td>
  </tr>`;

    const regLine = [
        registration.gstin ? `GSTIN: ${esc(registration.gstin)}` : "",
        registration.pan ? `PAN: ${esc(registration.pan)}` : "",
    ]
        .filter(Boolean)
        .join(" &middot; ");
    const periodLine = [fyLabel, periodLabel].filter(Boolean).map(esc).join(" &middot; ");

    return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${STYLE}</style></head>
  <body>
    <div class="card">
      <div class="title">GST Summary</div>
      ${regLine ? `<div class="subtitle">${regLine}</div>` : ""}
      ${periodLine ? `<div class="subtitle">${periodLine}</div>` : ""}
      <div class="section-head">GST Rate-wise Breakup</div>
      <table>
        <thead><tr>${COLS.map((c, i) => `<th class="${i === 0 ? "rate" : "amt"}">${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${rateBreakup.map(dataRow).join("")}${totalRow}</tbody>
      </table>
      ${dueDate ? `<div class="footer">GSTR-3B due date: ${esc(prettyDate(dueDate))}</div>` : ""}
    </div>
  </body>
</html>`;
};

module.exports = { gstSummaryTemplate };

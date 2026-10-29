const { formatNumberWithLocalString } = require("./formatter");
const { POSTING_LABELS } = require("../models/use-cases/journalPosting");

// Everything that reaches the page is escaped: the renderer runs Chromium with
// --no-sandbox, so party names and notes must never be able to inject markup.
const escapeHtml = value =>
    String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const money = value =>
    value === null || value === undefined || value === "" ? "" : formatNumberWithLocalString(value);

const sideOf = (row, value) => (row.debit === null && row.credit === null ? "—" : money(value));

const dayOf = value => (value ? String(value).slice(0, 10) : "");

const summaryCell = (label, value, tinted) => `
    <div class="tile${tinted ? " tile-closing" : ""}">
        <span class="tile-label">${escapeHtml(label)}</span>
        <span class="tile-value">${escapeHtml(money(value))}</span>
    </div>`;

const postingCell = posting => {
    const label = POSTING_LABELS[(posting && posting.state) || "notApplicable"] || POSTING_LABELS.notApplicable;
    const note =
        posting && posting.state === "notPosted" && posting.note
            ? `<div class="posting-note">${escapeHtml(posting.note)}</div>`
            : "";
    return `${escapeHtml(label)}${note}`;
};

const bodyRow = row => `
    <tr>
        <td>${escapeHtml(dayOf(row.date))}</td>
        <td>${escapeHtml(row.particulars)}</td>
        <td>${escapeHtml(row.reference || "")}</td>
        <td>${escapeHtml(row.type)}</td>
        <td class="num">${escapeHtml(sideOf(row, row.debit))}</td>
        <td class="num">${escapeHtml(sideOf(row, row.credit))}</td>
        <td class="num">${escapeHtml(money(row.balance))}</td>
        <td>${postingCell(row.posting)}</td>
    </tr>`;

const markerRow = (label, balance, debit, credit) => `
    <tr class="marker">
        <td></td>
        <td>${escapeHtml(label)}</td>
        <td></td>
        <td></td>
        <td class="num">${escapeHtml(money(debit))}</td>
        <td class="num">${escapeHtml(money(credit))}</td>
        <td class="num">${escapeHtml(money(balance))}</td>
        <td></td>
    </tr>`;

const FILTERED_NOTE =
    "Only the lines matching these filters are listed. The figures above and the balance column cover the whole period.";

const ledgerStatementTemplate = ({ partyName, range, statement, convention, filterLabel }) => {
    const period = range ? `${dayOf(range.from)} to ${dayOf(range.to)}` : "All dates";

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Statement of Accounts</title>
<style>
    @page { size: A4 landscape; margin: 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 11px; margin: 0; }
    h1 { font-size: 18px; margin: 0 0 2px; }
    .meta { color: #6b7280; margin-bottom: 14px; }
    .tiles { display: flex; gap: 10px; margin-bottom: 14px; }
    .tile { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
    .tile-closing { background: #f8fafc; }
    .tile-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; }
    .tile-value { display: block; font-size: 14px; font-weight: 700; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 5px 6px; }
    td.num, th.num { text-align: right; }
    tr.marker td { font-weight: 700; background: #f8fafc; }
    .note { margin-top: 10px; color: #6b7280; font-size: 10px; }
    .posting-note { color: #6b7280; font-size: 9px; }
</style>
</head>
<body>
    <h1>Statement of Accounts</h1>
    <div class="meta">
        ${escapeHtml(partyName || "")} &nbsp;·&nbsp; ${escapeHtml(period)}
        &nbsp;·&nbsp; generated ${escapeHtml(new Date().toISOString().slice(0, 10))}
        ${filterLabel ? `&nbsp;·&nbsp; ${escapeHtml(filterLabel)}` : ""}
    </div>

    <div class="tiles">
        ${summaryCell("Opening balance", statement.openingBalance)}
        ${summaryCell("Total debit", statement.totalDebit)}
        ${summaryCell("Total credit", statement.totalCredit)}
        ${summaryCell("Closing balance", statement.closingBalance, true)}
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th>Reference</th>
                <th>Type</th>
                <th class="num">Debit</th>
                <th class="num">Credit</th>
                <th class="num">Balance</th>
                <th>Posted</th>
            </tr>
        </thead>
        <tbody>
            ${filterLabel ? "" : markerRow("Opening balance", statement.openingBalance, "", "")}
            ${statement.rows.map(bodyRow).join("")}
            ${filterLabel ? "" : markerRow("Closing balance", statement.closingBalance, statement.totalDebit, statement.totalCredit)}
        </tbody>
    </table>

    <div class="note">
        ${escapeHtml(convention || "")}
        ${filterLabel ? escapeHtml(FILTERED_NOTE) : ""}
        ${statement.truncated ? "This statement was truncated; narrow the period to see every line." : ""}
    </div>
</body>
</html>`;
};

module.exports = { ledgerStatementTemplate, escapeHtml };

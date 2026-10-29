const moment = require("moment");
const ErrorResponse = require("./error-response");
const { generateExcelBufferAndType } = require("./generateExcelBufferAndType");
const { escapeHtml } = require("./ledgerStatementTemplate");
const { formatNumberWithLocalString } = require("./formatter");

const EXPORT_FORMATS = ["excel", "pdf"];
const EXPORT_MAX_ROWS = 5000;

const EXTENSIONS = { excel: "xlsx", pdf: "pdf" };

// A column is { header, value(row), money? }. Numbers stay numbers in Excel so they can be summed.
const cellValue = (column, row) => {
    const value = column.value(row);
    return value === null || value === undefined ? "" : value;
};

const rupees = value => `₹ ${formatNumberWithLocalString(value)}`;

const pdfCell = (column, row) => {
    const value = cellValue(column, row);
    const text = column.money && value !== "" ? rupees(value) : value;
    return `<td${column.money ? ' class="num"' : ""}>${escapeHtml(text)}</td>`;
};

// A summary tile is { label, value, money? } — the totals a screen shows above its table.
const summaryTile = ({ label, value, money }) => `
        <div class="tile">
            <span class="tile-label">${escapeHtml(label)}</span>
            <span class="tile-value">${escapeHtml(money ? rupees(value) : value)}</span>
        </div>`;

const tableTemplate = ({ title, subtitle, columns, rows, summary, note }) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
    @page { size: A4 landscape; margin: 14mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 10px; margin: 0; }
    h1 { font-size: 18px; margin: 0 0 2px; }
    .meta { color: #6b7280; margin-bottom: 14px; }
    .tiles { display: flex; gap: 10px; margin-bottom: 14px; }
    .tile { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
    .tile-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; }
    .tile-value { display: block; font-size: 14px; font-weight: 700; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #f3f4f6; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 5px 6px; vertical-align: top; }
    td.num, th.num { text-align: right; white-space: nowrap; }
    td:first-child { white-space: nowrap; }
    .note { margin-top: 10px; color: #6b7280; font-size: 10px; }
</style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
        ${escapeHtml(subtitle || "")} &nbsp;·&nbsp; ${rows.length} rows
        &nbsp;·&nbsp; generated ${escapeHtml(new Date().toISOString().slice(0, 10))}
    </div>
    ${summary && summary.length ? `<div class="tiles">${summary.map(summaryTile).join("")}</div>` : ""}
    <table>
        <thead>
            <tr>${columns.map(c => `<th${c.money ? ' class="num"' : ""}>${escapeHtml(c.header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
            ${rows.map(row => `<tr>${columns.map(c => pdfCell(c, row)).join("")}</tr>`).join("")}
        </tbody>
    </table>
    ${note ? `<div class="note">${escapeHtml(note)}</div>` : ""}
</body>
</html>`;

const buildTableExport = async ({ format, title, subtitle, columns, rows, summary, note }) => {
    if (format === "pdf") {
        // Loaded here so Excel exports (and tests) never pull in puppeteer.
        const { renderPdf } = require("./puppeteerPool");
        const buffer = await renderPdf(tableTemplate({ title, subtitle, columns, rows, summary, note }));
        if (!buffer || !buffer.length) throw new ErrorResponse("Could not render the PDF", 503);
        return { buffer, contentType: "application/pdf", extension: EXTENSIONS.pdf };
    }

    const data = rows.map(row =>
        Object.fromEntries(columns.map(column => [column.header, cellValue(column, row)]))
    );
    const { buffer, fileType } = await generateExcelBufferAndType(data, format);
    return { buffer: Buffer.from(buffer), contentType: fileType, extension: EXTENSIONS[format] };
};

const requireExportFormat = (req, res, next) =>
    EXPORT_FORMATS.includes(req.params.format)
        ? next()
        : next(new ErrorResponse("Unsupported export format", 400));

const sendTableExport = (res, { buffer, contentType, extension }, fileName) => {
    const safeName = String(fileName).replace(/[/\\:*?"<>|]/g, "-");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.${extension}"`);
    return res.status(200).send(buffer);
};

const dayOf = date => moment(date).format("YYYY-MM-DD");

const periodOf = (from, to) => `${dayOf(from)} to ${dayOf(to || new Date())}`;

// Sends every row a list's current filters match (not just the visible page) as one file,
// refusing an empty or oversized result. `list` is the page's own list function; `summaryOf` and `note`
// optionally put the totals the screen shows above its table into the PDF.
// The two steps are called through module.exports so a test can spy on them.
const sendListExport = async ({
    res,
    next,
    format,
    list,
    serialize,
    columns,
    title,
    period,
    subtitleOf,
    summaryOf,
    note,
}) => {
    const result = await list({ limit: EXPORT_MAX_ROWS, offset: 0 });

    if (!result.rows.length) return next(new ErrorResponse("No data is available for export", 404));
    if (result.count > EXPORT_MAX_ROWS) {
        return next(
            new ErrorResponse(
                `Too many rows to export (limit ${EXPORT_MAX_ROWS}). Narrow the date range.`,
                422
            )
        );
    }

    const rows = result.rows.map(row => serialize(row));
    const subtitle = [`Period: ${period}`, ...subtitleOf(rows)].filter(Boolean).join("  ·  ");

    const file = await module.exports.buildTableExport({
        format,
        title,
        subtitle,
        columns,
        rows,
        summary: summaryOf ? summaryOf(result) : undefined,
        note,
    });
    return module.exports.sendTableExport(res, file, `${title} ${period}`);
};

const voidedNote = row =>
    row.voidReason ? `${row.voidReason}${row.voidedByName ? ` · ${row.voidedByName}` : ""}` : "";

const deletedNote = row =>
    row.deleted
        ? `Deleted${row.deleteReason ? `: ${row.deleteReason}` : ""}${row.deletedByName ? ` · ${row.deletedByName}` : ""}`
        : "";

const booksLabel = row => {
    if (row.booksSynced === undefined || row.booksSynced === null) return null;
    if (row.deleted) return "Deleted, still in the books";
    return row.booksSynced ? "Synced" : "Not synced";
};

// A note or reason, followed by why and by whom the entry was reversed, as it reads on screen.
const withVoidedNote = (text, row) =>
    [text, voidedNote(row), deletedNote(row)].filter(Boolean).join(" — ");

const FILTERED_ROWS_NOTE =
    "The rows follow the filters chosen, but the figures above always cover the whole period.";

module.exports = {
    EXPORT_FORMATS,
    EXPORT_MAX_ROWS,
    requireExportFormat,
    buildTableExport,
    sendTableExport,
    periodOf,
    sendListExport,
    withVoidedNote,
    booksLabel,
    FILTERED_ROWS_NOTE,
};

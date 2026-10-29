const { renderPdf } = require('./puppeteerPool')
const { escapeHtml } = require('./cardHelpers')

const IST = 'Asia/Kolkata'

// Amounts are rendered as plain grouped numbers under an "(INR)" column head rather than with a ₹
// glyph: the render runs in a headless container whose system fonts are not guaranteed to carry
// U+20B9, and a tofu box in a financial document is worse than no symbol. It is also how printed bank
// statements read.
const money = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const n = Number(value)
    if (!Number.isFinite(n)) return ''
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const dayLabel = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST })
}

const stampLabel = (value) => {
    const d = value ? new Date(value) : new Date()
    const day = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: IST })
    const time = d
        .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST })
        .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase())
    return `${day}, ${time} IST`
}

const monthLabel = (value) =>
    new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: IST })

// The closing marker's date is the exclusive end of the range, so it lands on the 1st of the next
// month. Step back a day so the document reads "31 Aug 2026", not "01 Sep 2026".
const inclusiveEnd = (monthEnd) => new Date(new Date(monthEnd).getTime() - 1)

const periodLabel = (monthStart, monthEnd) =>
    `${dayLabel(monthStart)} to ${dayLabel(inclusiveEnd(monthEnd))}`

const STYLES = `
    /* Peko brand red (tailwind brandColor #FF3A3A) carries structure only — the masthead rule, the
       document label, the table head and the closing balance. Everything a reader must compare stays
       neutral, so the colour marks where to look instead of competing with the figures. */
    :root { --brand: #FF3A3A; --brand-tint: #FFF4F3; --ink: #1b1b21; --muted: #5b5b66; --faint: #8a8a96; --rule: #e3e3e8; }
    @page { size: A4 portrait; margin: 14mm 12mm 18mm; }
    * { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
        margin: 0;
        font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "DejaVu Sans", Arial, sans-serif;
        font-size: 9pt;
        line-height: 1.45;
        color: var(--ink);
    }
    .letterhead {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--brand);
    }
    .brand-logo { display: block; width: 104px; height: auto; margin-bottom: 8px; }
    .org-name { margin: 0; font-size: 15pt; font-weight: 600; letter-spacing: -0.2px; }
    .org-sub { margin: 2px 0 0; font-size: 8.5pt; color: var(--muted); }
    .doc { text-align: right; }
    .doc-kind {
        margin: 0;
        font-size: 8pt;
        font-weight: 600;
        letter-spacing: 1.1px;
        text-transform: uppercase;
        color: var(--brand);
    }
    .doc-period { margin: 2px 0 0; font-size: 11pt; font-weight: 600; }
    .meta {
        display: flex;
        gap: 28px;
        margin-top: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e3e3e8;
    }
    .meta div { display: flex; flex-direction: column; gap: 1px; }
    .meta span { font-size: 7.5pt; letter-spacing: 0.5px; text-transform: uppercase; color: var(--faint); }
    .meta strong { font-size: 9pt; font-weight: 600; }
    .summary {
        display: flex;
        margin: 14px 0 16px;
        border: 1px solid var(--rule);
        border-radius: 4px;
        overflow: hidden;
    }
    .summary div { flex: 1; padding: 9px 12px; border-right: 1px solid var(--rule); }
    .summary div:last-child { border-right: 0; }
    .summary span { display: block; font-size: 7.5pt; letter-spacing: 0.5px; text-transform: uppercase; color: var(--faint); }
    .summary strong { display: block; margin-top: 3px; font-size: 11pt; font-weight: 600; font-variant-numeric: tabular-nums; }
    .summary .closing { background: var(--brand-tint); }
    .summary .closing span { color: var(--brand); }
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tfoot { display: table-row-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th {
        padding: 7px 6px;
        border-bottom: 1.5px solid var(--brand);
        font-size: 7.5pt;
        font-weight: 600;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        text-align: left;
        color: var(--muted);
    }
    td { padding: 6px; border-bottom: 1px solid #eeeef2; vertical-align: top; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .date { white-space: nowrap; }
    .ref { color: var(--muted); word-break: break-word; }
    .type { color: var(--muted); }
    .marker td { background: var(--brand-tint); font-weight: 600; }
    .marker.closing td { border-top: 1px solid var(--brand); border-bottom: 1px solid var(--brand); }
    .empty td { padding: 22px 6px; text-align: center; color: var(--faint); }
    .note { margin-top: 14px; font-size: 7.5pt; line-height: 1.5; color: var(--muted); }
    .note strong { color: var(--ink); }
    .warn {
        margin-top: 10px;
        padding: 7px 10px;
        border: 1px solid #d9c38a;
        border-radius: 4px;
        background: #fdf7e6;
        font-size: 8pt;
        color: #6b5312;
    }
`

const FOOTER = `
    <div style="width:100%;padding:0 12mm;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:7pt;color:#8a8a96;display:flex;justify-content:space-between;">
        <span>This is a system-generated statement and does not require a signature.</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
`

const row = (r) => {
    const kind = r.kind === 'opening' || r.kind === 'closing' ? ` marker ${r.kind}` : ''
    return `<tr class="${kind.trim()}">
        <td class="date">${escapeHtml(r.kind === 'closing' ? 'End of period' : dayLabel(r.date))}</td>
        <td>${escapeHtml(r.description)}</td>
        <td class="ref">${escapeHtml(r.reference)}</td>
        <td class="type">${escapeHtml(r.type)}</td>
        <td class="num">${money(r.moneyOut)}</td>
        <td class="num">${money(r.moneyIn)}</td>
        <td class="num">${money(r.balance)}</td>
    </tr>`
}

const EMPTY_ROW = '<tr class="empty"><td colspan="7">No transactions were recorded in this period.</td></tr>'

/**
 * Statement document as a self-contained HTML string.
 *
 * Every value that reaches the markup is escaped: descriptions and references carry merchant names and
 * admin-entered text, and this HTML is handed to a Chromium that runs with --no-sandbox. Escaping is
 * what stops an injected tag from turning a statement into an outbound request.
 */
const buildStatementHtml = ({ corporate, month, monthStart, monthEnd, summary, rows, truncated, generatedAt, logo, branding }) => {
    const org = (corporate?.companyName || '').trim() || 'Corporate account'
    const orgSub = [corporate?.city, corporate?.country].map((v) => (v || '').trim()).filter(Boolean).join(', ')
    const body = rows.length ? rows.map(row).join('') : EMPTY_ROW
    // Only ever a data: URI (the caller inlines it via fetchAsDataUri). A remote src would make the
    // render wait on the network — the airline ticket's 180s production hang.
    const mark = typeof logo === 'string' && logo.startsWith('data:')
        ? `<img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(branding || 'Peko')}">`
        : ''

    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Account statement ${escapeHtml(month)}</title><style>${STYLES}</style></head>
<body>
    <header class="letterhead">
        <div>
            ${mark}
            <h1 class="org-name">${escapeHtml(org)}</h1>
            ${orgSub ? `<p class="org-sub">${escapeHtml(orgSub)}</p>` : ''}
        </div>
        <div class="doc">
            <p class="doc-kind">Corporate Cards &middot; Account statement</p>
            <p class="doc-period">${escapeHtml(monthLabel(monthStart))}</p>
        </div>
    </header>

    <section class="meta">
        <div><span>Statement period</span><strong>${escapeHtml(periodLabel(monthStart, monthEnd))}</strong></div>
        <div><span>Account</span><strong>${escapeHtml(String(corporate?.corporateId ?? ''))}</strong></div>
        <div><span>Generated</span><strong>${escapeHtml(stampLabel(generatedAt))}</strong></div>
    </section>

    <section class="summary">
        <div><span>Opening balance</span><strong>${money(summary.openingBalance)}</strong></div>
        <div><span>Money in</span><strong>${money(summary.moneyIn)}</strong></div>
        <div><span>Money out</span><strong>${money(summary.moneyOut)}</strong></div>
        <div class="closing"><span>Closing balance</span><strong>${money(summary.closingBalance)}</strong></div>
    </section>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Type</th>
                <th class="num">Money out (INR)</th>
                <th class="num">Money in (INR)</th>
                <th class="num">Balance (INR)</th>
            </tr>
        </thead>
        <tbody>${body}</tbody>
    </table>

    ${truncated ? '<p class="warn">This period exceeds the maximum number of rows a statement can carry, so the list above is incomplete. Narrow the period or use the CSV export for the full record.</p>' : ''}

    <p class="note">
        <strong>What this covers.</strong> Wallet movements (top-ups, refunds, cashback, fees) and authorised
        card spend, ordered by the date each was recorded. Declined and reversed authorisations are excluded,
        and pending authorisations appear only once they are authorised. Balances are stated in INR.
    </p>
</body>
</html>`
}

// Page size AND margins come from the stylesheet's @page rule — the pool renders with
// preferCSSPageSize: true, which makes a `margin` option here silently ineffective. The 18mm bottom
// margin in @page is what the footer template is drawn into.
const renderStatementPdf = async (statement) =>
    renderPdf(buildStatementHtml(statement), {
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: FOOTER,
    })

module.exports = { buildStatementHtml, renderStatementPdf, money, dayLabel, periodLabel, monthLabel, stampLabel }

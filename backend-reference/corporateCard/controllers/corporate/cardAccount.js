const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { ENTRY_TYPE_META } = require('../../constants/ledger')
const { createEntry } = require('../../models/use-cases/corporateCardLedger')
const { buildStatement } = require('../../models/use-cases/cardStatement')
const { round2, MONTH_REGEX, csvEscape, monthRangeUtc, parsePaging, actorCredentialId } = require('../../utils/cardHelpers')
const { renderStatementPdf } = require('../../utils/statementPdf')
const { partnerLogos } = require('../../utils/partnerLogos')
const { fetchAsDataUri } = require('../../utils/imageToDataUri')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR } = require('../../constants/messages')

exports.createLedgerEntry = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { type, amount, reference, description, occurredAt } = req.body || {}
    const meta = ENTRY_TYPE_META[type]
    if (!meta) return next(new ErrorResponse('A valid entry type is required.', 400))

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return next(new ErrorResponse('A valid amount is required.', 400))

    let occurred = new Date()
    if (occurredAt) {
        occurred = new Date(occurredAt)
        if (Number.isNaN(occurred.getTime())) return next(new ErrorResponse('Invalid occurredAt date.', 400))
    }

    const ref = reference ? String(reference).trim().slice(0, 100) : null
    const entry = await createEntry({
        corporateId,
        entryType: type,
        direction: meta.direction,
        amount: round2(amt),
        description: description ? String(description).trim().slice(0, 255) : meta.label,
        reference: ref,
        refType: ref ? 'LEDGER_REF' : null,
        refId: ref || null,
        occurredAt: occurred,
        createdByCredentialId: actorCredentialId(req),
    })

    // F-CC-09: a cross-tenant refId collision yields no own-row — don't leak another corporate's entry.
    if (!entry) return next(new ErrorResponse('A ledger entry with this reference already exists.', 409))

    return res.status(200).json({
        status: true,
        message: 'Ledger entry recorded.',
        data: {
            id: entry.id,
            entryType: entry.entryType,
            direction: entry.direction,
            amount: Number(entry.amount),
            occurredAt: entry.occurredAt,
        },
        responseCode: '000',
    })
})

exports.getStatement = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const month = typeof req.query.month === 'string' ? req.query.month : ''
    if (!MONTH_REGEX.test(month)) return next(new ErrorResponse('A valid month (YYYY-MM) is required.', 400))

    const { monthStart, monthEnd } = monthRangeUtc(month)
    const { limit, offset } = parsePaging(req)
    const { openingBalance, moneyIn, moneyOut, closingBalance, rows, truncated } = await buildStatement({ corporateId, monthStart, monthEnd })

    const openingRow = { date: monthStart, description: 'Opening balance', reference: '', type: '', moneyOut: null, moneyIn: null, balance: openingBalance, kind: 'opening' }
    const closingRow = { date: monthEnd, description: 'Closing balance', reference: '', type: '', moneyOut, moneyIn, balance: closingBalance, kind: 'closing' }

    const count = rows.length
    const pageRows = rows.slice(offset, offset + limit)
    const hasContent = pageRows.length > 0 || count === 0
    const showOpening = hasContent && offset === 0
    const showClosing = hasContent && offset + limit >= count

    return res.status(200).json({
        status: true,
        message: 'Account statement fetched.',
        data: {
            month,
            summary: { openingBalance, moneyIn, moneyOut, closingBalance },
            count,
            page: Math.floor(offset / limit) + 1,
            itemsPerPage: limit,
            rows: [
                ...(showOpening ? [openingRow] : []),
                ...pageRows,
                ...(showClosing ? [closingRow] : []),
            ],
            truncated,
        },
        responseCode: '000',
    })
})

exports.exportStatement = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const month = typeof req.query.month === 'string' ? req.query.month : ''
    if (!MONTH_REGEX.test(month)) return next(new ErrorResponse('A valid month (YYYY-MM) is required.', 400))

    const { monthStart, monthEnd } = monthRangeUtc(month)
    const { openingBalance, moneyIn, moneyOut, closingBalance, rows } = await buildStatement({ corporateId, monthStart, monthEnd })

    const money = (n) => (n === null || n === undefined ? '' : Number(n).toFixed(2))
    const isoDate = (d) => (d ? new Date(d).toISOString() : '')
    const lines = [
        ['Date', 'Description', 'Reference', 'Type', 'Money out', 'Money In', 'Balance'],
        [isoDate(monthStart), 'Opening balance', '', '', '', '', money(openingBalance)],
        ...rows.map((r) => [isoDate(r.date), r.description, r.reference, r.type, money(r.moneyOut), money(r.moneyIn), money(r.balance)]),
        [isoDate(monthEnd), 'Closing balance', '', '', money(moneyOut), money(moneyIn), money(closingBalance)],
    ]
    const csv = String.fromCharCode(0xfeff) + lines.map((cols) => cols.map(csvEscape).join(',')).join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="account-statement-${month}.csv"`)
    return res.status(200).send(csv)
})

/**
 * The statement as a print-ready PDF, rendered here rather than from the screen.
 *
 * The browser's own print produced a picture of the dashboard — sidebar, filters, and only the page of
 * rows currently loaded. This builds the document from the same numbers the JSON and CSV are built
 * from, so all three agree for a period, and covers every row rather than the visible page.
 */
exports.exportStatementPdf = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const month = typeof req.query.month === 'string' ? req.query.month : ''
    if (!MONTH_REGEX.test(month)) return next(new ErrorResponse('A valid month (YYYY-MM) is required.', 400))

    const { monthStart, monthEnd } = monthRangeUtc(month)
    const { openingBalance, moneyIn, moneyOut, closingBalance, rows, truncated } = await buildStatement({ corporateId, monthStart, monthEnd })

    const openingRow = { date: monthStart, description: 'Opening balance', reference: '', type: '', moneyOut: null, moneyIn: null, balance: openingBalance, kind: 'opening' }
    const closingRow = { date: monthEnd, description: 'Closing balance', reference: '', type: '', moneyOut, moneyIn, balance: closingBalance, kind: 'closing' }

    const branding = await partnerLogos()
    const logo = await fetchAsDataUri(branding?.logo)

    let pdf
    try {
        pdf = await renderStatementPdf({
            logo,
            branding: branding?.branding,
            corporate: {
                corporateId,
                companyName: req.user?.companyName,
                city: req.user?.city,
                country: req.user?.country,
            },
            month,
            monthStart,
            monthEnd,
            summary: { openingBalance, moneyIn, moneyOut, closingBalance },
            rows: [openingRow, ...rows, closingRow],
            truncated,
            generatedAt: new Date(),
        })
    } catch (err) {
        // Never answer a PDF request with a non-PDF body under a PDF content type — a "downloaded"
        // file that will not open reads as corruption to the admin. Fail loudly instead.
        customLog(req?.LogTraceId, 'error', {
            message: '[Statement] PDF render failed',
            corporateId,
            month,
            rows: rows.length,
            error: err?.message,
        }, 'CONSOLE')
        return next(new ErrorResponse(err?.code === 'PDF_QUEUE_FULL'
            ? 'The statement service is busy. Please try again in a moment.'
            : GENERIC_ERROR, err?.status === 503 ? 503 : 500))
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', pdf.length)
    res.setHeader('Content-Disposition', `attachment; filename="account-statement-${month}.pdf"`)
    return res.status(200).send(pdf)
})

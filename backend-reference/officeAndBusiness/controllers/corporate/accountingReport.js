const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
    findAccountingReportSummary,
    findAccountingInsights,
    findBusinessHealth,
    findDetailedProfitAndLoss,
} = require("../../models/use-cases/accountingReport");
const { findAccountsReceivable } = require("../../models/use-cases/accountsReceivable");
const { findBalanceSheet } = require("../../models/use-cases/balanceSheet");
const { findCashFlowStatement } = require("../../models/use-cases/cashFlow");
const { findCashFlowOverview } = require("../../models/use-cases/cashFlowOverview");
const { findFreeCashFlow } = require("../../models/use-cases/freeCashFlow");
const { findGstSummary } = require("../../models/use-cases/gstSummary");
const { findAccountsPayable } = require("../../models/use-cases/accountsPayable");
const { findWorkingCapital } = require("../../models/use-cases/workingCapital");
const { fyDateRange } = require("../../utils/fyRange");
const puppeteer = require("puppeteer");
const { plComparisonTemplate, plStatementTemplate, prettyDate } = require("../../utils/plComparisonPdfTemplate");
const { gstSummaryTemplate } = require("../../utils/gstSummaryPdfTemplate");
const { bsComparisonTemplate, bsStatementTemplate } = require("../../utils/balanceSheetPdfTemplate");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");

const fyLabel = (y) => `FY ${y}-${String((y + 1) % 100).padStart(2, "0")}`;

// Render an HTML string to a PDF buffer. Page size/orientation come from the document's
// own @page CSS (preferCSSPageSize), so portrait/landscape is decided by the template.
const htmlToPdfBuffer = async (html) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new",
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                /* browser already closed */
            }
        }
    }
};

const subUserId = (req) =>
    req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId
        ? req.user.subCorporateId
        : null;

const round1 = (v) => Math.round(((Number(v) || 0) + Number.EPSILON) * 10) / 10;

// P&L Summary card shape, built from the detailed P&L summary. Line items carry their
// share of revenue; margins are the standard ratios. Everything divides safely (0 when
// there's no revenue/data), so absent data yields zeros rather than null/NaN.
const buildPnlSummary = (s = {}) => {
    const n = (v) => Number(v) || 0;
    const revenue = n(s.totalRevenue);
    const pct = (part) => (revenue > 0 ? round1((n(part) / revenue) * 100) : 0);
    const totalExpenses = n(s.totalCogs) + n(s.totalOperatingExpenses) + n(s.totalOtherExpenses) + n(s.tax);
    return {
        totalRevenue: revenue,
        costOfGoodsSold: { amount: n(s.totalCogs), pctOfRevenue: pct(s.totalCogs) },
        grossProfit: n(s.grossProfit),
        operatingExpenses: { amount: n(s.totalOperatingExpenses), pctOfRevenue: pct(s.totalOperatingExpenses) },
        operatingProfit: n(s.operatingProfit),
        otherIncome: { amount: n(s.totalOtherIncome), pctOfRevenue: pct(s.totalOtherIncome) },
        otherExpenses: { amount: n(s.totalOtherExpenses), pctOfRevenue: pct(s.totalOtherExpenses) },
        tax: { amount: n(s.tax), pctOfRevenue: pct(s.tax) },
        netProfit: n(s.netProfit),
        margins: {
            grossMargin: pct(s.grossProfit),
            operatingMargin: pct(s.operatingProfit),
            netMargin: pct(s.netProfit),
            expenseRatio: pct(totalExpenses),
        },
    };
};
exports._buildPnlSummary = buildPnlSummary;

// GET /accounting/reports/summary?fy&quarter&month | ?from&to
// Totals + category breakdown + monthly trend + top counterparties; powers the
// Expense / Revenue / P&L report pages. `fy` selects a financial year, optionally
// narrowed by `quarter` or `month`; `from`/`to` are used only when `fy` is absent.
exports.getReportSummary = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month, category } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        // P&L summary is a full-statement view of the period, so it ignores the
        // category filter (which only narrows the category breakdown below).
        const [data, pl] = await Promise.all([
            findAccountingReportSummary({
                corporateUserId: req.user.corporateId,
                subCorporateUserId: subUserId(req),
                from: range.from,
                to: range.to,
                category: category ? category.trim() : null,
            }),
            findDetailedProfitAndLoss({
                corporateUserId: req.user.corporateId,
                subCorporateUserId: subUserId(req),
                from: range.from,
                to: range.to,
            }),
        ]);
        data.pnl = buildPnlSummary(pl.summary);
        return res.status(200).json({
            status: true,
            message: "Report summary fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/profit-and-loss?fy&quarter&month | ?from&to
// Detailed multi-step P&L statement: Revenue, COGS, Gross Profit, Operating
// Expenses, Operating Profit, Other Income/Expenses, Profit Before Tax and Net
// Profit. Same date-range params as /summary.
exports.getProfitAndLoss = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findDetailedProfitAndLoss({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Profit and loss fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/balance-sheet?fy[&month]
// "As-of" snapshot of Assets = Liabilities + Equity. `fy` is the financial-year start
// year (2025 => FY 2025-26); the snapshot date is 31 Mar of the FY end, or the end of
// `month` (1-12) within that FY when provided.
exports.getBalanceSheet = asyncHandler(async (req, res, next) => {
    try {
        const { fy, month } = req.query;
        const { to: asOf } = fyDateRange(fy, null, month);
        const data = await findBalanceSheet({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            asOf,
        });
        return res.status(200).json({
            status: true,
            message: "Balance sheet fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/profit-and-loss/export?fy&quarter&month | ?from&to
// Exports the detailed P&L of the selected period as a single-page PDF (same page as
// the comparison's first page). Uses findDetailedProfitAndLoss (same data as /profit-and-loss).
exports.exportProfitAndLoss = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const pl = await findDetailedProfitAndLoss({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });

        const label = fy ? fyLabel(Number(fy)) : "";
        const periodLabel = [range.from, range.to].filter(Boolean).map(prettyDate).join(" – ");
        const html = plStatementTemplate({
            fyLabel: label,
            periodLabel,
            sections: pl.sections,
            summary: pl.summary,
        });
        const pdfBuffer = await htmlToPdfBuffer(html);

        return res.status(200).json({
            status: true,
            message: "Profit and loss exported successfully",
            data: { pdfBuffer, fileName: `Profit-and-Loss-${label || "statement"}.pdf` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/gst-summary/export?fy[&quarter|&month] | ?from&to
// Exports the GST rate-wise breakup (+ registration/period) as a single landscape PDF.
exports.exportGstSummary = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const gst = await findGstSummary({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });

        const label = fy ? fyLabel(Number(fy)) : "";
        const periodLabel = [range.from, range.to].filter(Boolean).map(prettyDate).join(" – ");
        const html = gstSummaryTemplate({
            fyLabel: label,
            periodLabel,
            registration: gst.registration,
            rateBreakup: gst.rateBreakup,
            dueDate: gst.filing && gst.filing.dueDate,
        });
        const pdfBuffer = await htmlToPdfBuffer(html);

        return res.status(200).json({
            status: true,
            message: "GST summary exported successfully",
            data: { pdfBuffer, fileName: `GST-Summary-${label || "statement"}.pdf` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/compare?fy=2025
// Generates a PDF comparing the detailed P&L of the selected FY and the FY before it —
// one page per year. Uses the same data as /profit-and-loss (findDetailedProfitAndLoss).
exports.getPlComparisonPdf = asyncHandler(async (req, res, next) => {
    try {
        const fy = Number(req.query.fy);
        const priorFy = fy - 1;
        const curRange = fyDateRange(fy);
        const priorRange = fyDateRange(priorFy);
        const base = {
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
        };

        const [curPl, priorPl] = await Promise.all([
            findDetailedProfitAndLoss({ ...base, from: curRange.from, to: curRange.to }),
            findDetailedProfitAndLoss({ ...base, from: priorRange.from, to: priorRange.to }),
        ]);

        const html = plComparisonTemplate({
            current: {
                fyLabel: fyLabel(fy),
                periodLabel: `${prettyDate(curRange.from)} – ${prettyDate(curRange.to)}`,
                sections: curPl.sections,
                summary: curPl.summary,
            },
            prior: {
                fyLabel: fyLabel(priorFy),
                periodLabel: `${prettyDate(priorRange.from)} – ${prettyDate(priorRange.to)}`,
                sections: priorPl.sections,
                summary: priorPl.summary,
            },
        });

        const pdfBuffer = await htmlToPdfBuffer(html);

        return res.status(200).json({
            status: true,
            message: "Profit and loss comparison PDF generated successfully",
            data: { pdfBuffer, fileName: `PL-Comparison-${fyLabel(priorFy)}-vs-${fyLabel(fy)}.pdf` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/balance-sheet/export?fy[&month]
// Exports the "as-of" Balance Sheet of the selected period as a single-page PDF
// (same page as the comparison's first page). Uses findBalanceSheet (same data as /balance-sheet).
exports.exportBalanceSheet = asyncHandler(async (req, res, next) => {
    try {
        const { fy, month } = req.query;
        const { to: asOf } = fyDateRange(fy, null, month);
        const bs = await findBalanceSheet({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            asOf,
        });

        const label = fy ? fyLabel(Number(fy)) : "";
        const html = bsStatementTemplate({
            fyLabel: label,
            periodLabel: `As of ${prettyDate(asOf)}`,
            statement: bs.statement,
        });
        const pdfBuffer = await htmlToPdfBuffer(html);

        return res.status(200).json({
            status: true,
            message: "Balance sheet exported successfully",
            data: { pdfBuffer, fileName: `Balance-Sheet-${label || "statement"}.pdf` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/balance-sheet/compare?fy=2025
// Generates a PDF comparing the FY-end Balance Sheet of the selected FY and the FY
// before it — one page per year. Uses the same data as /balance-sheet (findBalanceSheet).
exports.getBsComparisonPdf = asyncHandler(async (req, res, next) => {
    try {
        const fy = Number(req.query.fy);
        const priorFy = fy - 1;
        const { to: asOf } = fyDateRange(fy);
        const { to: priorAsOf } = fyDateRange(priorFy);
        const base = {
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
        };

        const [curBs, priorBs] = await Promise.all([
            findBalanceSheet({ ...base, asOf }),
            findBalanceSheet({ ...base, asOf: priorAsOf }),
        ]);

        const html = bsComparisonTemplate({
            current: {
                fyLabel: fyLabel(fy),
                periodLabel: `As of ${prettyDate(asOf)}`,
                statement: curBs.statement,
            },
            prior: {
                fyLabel: fyLabel(priorFy),
                periodLabel: `As of ${prettyDate(priorAsOf)}`,
                statement: priorBs.statement,
            },
        });

        const pdfBuffer = await htmlToPdfBuffer(html);

        return res.status(200).json({
            status: true,
            message: "Balance sheet comparison PDF generated successfully",
            data: { pdfBuffer, fileName: `BS-Comparison-${fyLabel(priorFy)}-vs-${fyLabel(fy)}.pdf` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/cash-flow-statement?fy[&quarter|&month] | ?from&to
// Indirect-method cash flow for the selected period. `fy` (+ optional quarter/month)
// drives from/to; explicit from/to are used only when `fy` is absent.
exports.getCashFlowStatement = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findCashFlowStatement({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Cash flow statement fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/cash-flow-overview?fy[&quarter|&month] | ?from&to
// Stat cards (with prior-period deltas), monthly net-by-activity trend, and monthly cash
// balance progression. Same period selection as the cash flow statement.
exports.getCashFlowOverview = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findCashFlowOverview({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Cash flow overview fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/free-cash-flow?fy[&quarter|&month] | ?from&to
// FCF (Operating CF - Capex), capex breakdown, and capex ratio for the period.
exports.getFreeCashFlow = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findFreeCashFlow({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Free cash flow analysis fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/gst-summary?fy[&quarter|&month] | ?from&to
// Registration (GSTIN/PAN), per-slab GST rate breakup, and GSTR-3B due date.
exports.getGstSummary = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findGstSummary({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "GST summary fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/accounts-payable?fy[&quarter|&month] | ?from&to
// Vendor bills with derived status/aging/distribution/trend + payment metrics.
exports.getAccountsPayable = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findAccountsPayable({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Accounts payable fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/working-capital?fy[&quarter|&month] | ?from&to
// DSO/DPO/CCC plus the receivables/payables outstanding totals and aging buckets.
exports.getWorkingCapital = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findWorkingCapital({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Working capital fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getReportInsights = asyncHandler(async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const data = await findAccountingInsights({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: from || null,
            to: to || null,
        });
        return res.status(200).json({
            status: true,
            message: "Report insights fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getAccountsReceivable = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, fy, quarter, month } = req.query;
        // `fy` (+ optional quarter/month) drives from/to; else explicit from/to.
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findAccountsReceivable({
            corporateUserId: req.user.corporateId,
            from: range.from,
            to: range.to,
        });
        return res.status(200).json({
            status: true,
            message: "Accounts receivable fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting/reports/accounts-receivable/export/:format  (excel | csv)
// Exports the AR invoice list (same filters/data as /accounts-receivable) as a spreadsheet.
exports.exportAccountsReceivable = asyncHandler(async (req, res, next) => {
    try {
        const format = req.params.format === "csv" ? "csv" : "excel";
        const { from, to, fy, quarter, month } = req.query;
        const range = fy
            ? fyDateRange(fy, quarter, month)
            : { from: from || null, to: to || null };
        const data = await findAccountsReceivable({
            corporateUserId: req.user.corporateId,
            from: range.from,
            to: range.to,
        });

        if (!data.invoices || data.invoices.length === 0) {
            return next(new ErrorResponse("No data available for download.", 404));
        }

        const rows = data.invoices.map((inv) => ({
            Customer: inv.customer,
            "Invoice No": inv.invoiceNo,
            "Invoice Date": inv.invoiceDate,
            "Due Date": inv.dueDate,
            Amount: inv.amount,
            Paid: inv.paid,
            Outstanding: inv.outstanding,
            Status: inv.status,
        }));
        const { buffer, fileType } = await generateExcelBufferAndType(rows, format);

        const label = fy ? fyLabel(Number(fy)) : "";
        return res.status(200).json({
            status: true,
            message: "Accounts receivable exported successfully",
            data: { buffer, fileType, fileName: `Accounts-Receivable-${label || "report"}.${format === "csv" ? "csv" : "xlsx"}` },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getBusinessHealth = asyncHandler(async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const data = await findBusinessHealth({
            corporateUserId: req.user.corporateId,
            subCorporateUserId: subUserId(req),
            from: from || null,
            to: to || null,
        });
        return res.status(200).json({
            status: true,
            message: "Business health fetched successfully",
            data,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

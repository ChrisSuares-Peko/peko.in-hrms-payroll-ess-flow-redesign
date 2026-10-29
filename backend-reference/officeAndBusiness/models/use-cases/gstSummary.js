const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const gstRateEntry = require("../entities/gstRateEntry");
const corporateUser = require("../entities/corporateUser");
const invoicingV2 = require("../entities/invoicingV2");
const taxGstr1Filing = require("../entities/taxGstr1Filing");
const taxGstr3bFiling = require("../entities/taxGstr3bFiling");
const { enumerateMonths } = require("../../utils/monthRange");

const num = (v) => Number(v) || 0;
const round0 = (v) => Math.round(num(v));
const round1 = (v) => Math.round((num(v) + Number.EPSILON) * 10) / 10;
const iso = (d) => d.toISOString().slice(0, 10);

// Standard GST slabs — always present as rows (even when zero) for a stable table.
const GST_RATES = [0, 5, 12, 18, 28];

// Return types tracked in the Filing Calendar, and the day of the month AFTER the tax
// period that each is due on (e.g. the Mar period's GSTR-1 is due 11 Apr).
const RETURN_TYPES = ["GSTR-1", "GSTR-3B"];
const RETURN_DUE_DAY = { "GSTR-1": 11, "GSTR-3B": 20 };

const ownerWhere = (p) => {
    const where = { corporateUserId: p.corporateUserId };
    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    return where;
};
const dateWhere = (from, to) => {
    if (from && to) return { txnDate: { [Op.between]: [from, to] } };
    if (to) return { txnDate: { [Op.lte]: to } };
    if (from) return { txnDate: { [Op.gte]: from } };
    return {};
};

// GSTR-3B for a tax period is due the 20th of the following month; here we use the
// month after the period end (`to`). Returns null when there is no bounded end date.
const gstr3bDueDate = (to) => {
    if (!to) return null;
    const d = new Date(to);
    return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 20)));
};

// Due date for a return type covering tax period `ym` ("YYYY-MM") — the Nth of the
// following calendar month (`m` from the period is 1-based, which is already the
// following month's 0-based index for Date.UTC).
const returnDueDate = (ym, type) => {
    const [y, m] = ym.split("-").map(Number);
    return iso(new Date(Date.UTC(y, m, RETURN_DUE_DAY[type])));
};

// Indian FY ("2026-27") that a calendar month ("YYYY-MM") belongs to (Apr-Mar).
const fyStringForMonth = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    const startYear = m >= 4 ? y : y - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
};

const monthBefore = (dateStr) => {
    const d = new Date(dateStr);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return iso(d);
};

// Derive PAN from a GSTIN when not stored separately (chars 3-12 are the PAN).
const panFromGstin = (gstin) => (gstin && gstin.length >= 12 ? gstin.slice(2, 12) : null);

// Output-side GST derived from a sales invoice's line items. Each item contributes its
// netAmount as the taxable value and netAmount*taxRate/100 as output tax, split into
// CGST/SGST (Intra-State — the default) or IGST (only when taxType is Inter-State).
const invoiceRateRows = (inv) => {
    let items = inv.items;
    if (typeof items === "string") {
        try {
            items = JSON.parse(items);
        } catch (e) {
            items = [];
        }
    }
    if (!Array.isArray(items)) return [];
    const interState = inv.taxType === "Inter-State";
    const month = inv.invoiceDate ? String(inv.invoiceDate).slice(0, 7) : null;
    return items.map((it) => {
        const rate = Number(it.taxRate) || 0;
        const taxable = num(it.netAmount);
        const tax = (taxable * rate) / 100;
        return {
            rate,
            taxable,
            cgst: interState ? 0 : tax / 2,
            sgst: interState ? 0 : tax / 2,
            igst: interState ? tax : 0,
            itc: 0,
            month,
        };
    });
};

// Pure assembly (no DB). `rateEntries` are raw per-rate/per-month rows; outputGst,
// netPayable and the totals card are derived so the response always satisfies the
// consistency rules. `returns` is the pre-built Filing Calendar (DB lookups already done).
const assembleGstSummary = ({ from, to, registration, rateEntries, dueDate, returns }) => {
    const byRate = new Map();
    const byMonth = new Map();
    rateEntries.forEach((r) => {
        const rate = Number(r.rate);
        const b = byRate.get(rate) || { taxable: 0, itc: 0, cgst: 0, sgst: 0, igst: 0 };
        b.taxable += num(r.taxable);
        b.itc += num(r.itc);
        b.cgst += num(r.cgst);
        b.sgst += num(r.sgst);
        b.igst += num(r.igst);
        byRate.set(rate, b);

        if (r.month) {
            const mb = byMonth.get(r.month) || { taxable: 0, itc: 0, cgst: 0, sgst: 0, igst: 0 };
            mb.taxable += num(r.taxable);
            mb.itc += num(r.itc);
            mb.cgst += num(r.cgst);
            mb.sgst += num(r.sgst);
            mb.igst += num(r.igst);
            byMonth.set(r.month, mb);
        }
    });

    const rates = [...new Set([...GST_RATES, ...byRate.keys()])].sort((a, b) => a - b);
    const rateBreakup = rates.map((rate) => {
        const b = byRate.get(rate) || { taxable: 0, itc: 0, cgst: 0, sgst: 0, igst: 0 };
        const cgst = round0(b.cgst);
        const sgst = round0(b.sgst);
        const igst = round0(b.igst);
        const itc = round0(b.itc);
        const outputGst = cgst + sgst + igst;
        return {
            rate,
            taxable: round0(b.taxable),
            outputGst,
            itc,
            cgst,
            sgst,
            igst,
            netPayable: outputGst - itc,
        };
    });

    const totals = rateBreakup.reduce(
        (acc, r) => ({
            taxableTurnover: acc.taxableTurnover + r.taxable,
            outputGst: acc.outputGst + r.outputGst,
            itc: acc.itc + r.itc,
            netPayable: acc.netPayable + r.netPayable,
        }),
        { taxableTurnover: 0, outputGst: 0, itc: 0, netPayable: 0 }
    );
    totals.itcUtilisationPct = totals.outputGst > 0 ? round1((totals.itc / totals.outputGst) * 100) : 0;

    // Continuous month series when the range is bounded (zero-filled gaps); otherwise
    // fall back to the months that actually have data.
    const monthKeys = enumerateMonths(from, to) || [...byMonth.keys()].sort((a, b) => a.localeCompare(b));
    const monthly = monthKeys.map((month) => {
        const b = byMonth.get(month) || { taxable: 0, itc: 0, cgst: 0, sgst: 0, igst: 0 };
        const outputGst = round0(b.cgst + b.sgst + b.igst);
        const itc = round0(b.itc);
        return { month, taxable: round0(b.taxable), outputGst, itc, netPayable: outputGst - itc };
    });

    return {
        range: { from: from || null, to: to || null },
        registration,
        rateBreakup,
        totals,
        monthly,
        filing: { dueDate: dueDate || null, returns: returns || [] },
    };
};

// Build the GSTR-1/GSTR-3B Filing Calendar: every return whose DUE DATE (not tax
// period) falls within [from, to] — e.g. FY 2026-27 (Apr'26-Mar'27) starts with the
// Mar'26 period's returns, due in Apr'26, and ends with the Feb'27 period's returns,
// due in Mar'27. Status is "filed" when a stored filing row says so; otherwise "due"
// or "overdue" depending on today vs the due date.
const buildFilingReturns = async (p, from, to, gstin) => {
    if (!from || !to || !gstin) return [];

    const periodMonths = enumerateMonths(monthBefore(from), to) || [];
    const candidates = [];
    periodMonths.forEach((ym) => {
        RETURN_TYPES.forEach((type) => {
            const dueDate = returnDueDate(ym, type);
            if (dueDate >= from && dueDate <= to) {
                candidates.push({ type, period: ym, dueDate, financialYear: fyStringForMonth(ym), month: Number(ym.split("-")[1]) });
            }
        });
    });
    if (!candidates.length) return [];

    const finYears = [...new Set(candidates.map((c) => c.financialYear))];
    const filingWhere = { corporateUserId: p.corporateUserId, gstin, financialYear: { [Op.in]: finYears } };
    const [gstr1Rows, gstr3bRows] = await Promise.all([
        taxGstr1Filing.findAll({ where: filingWhere, attributes: ["financialYear", "month", "status", "filedAt"], raw: true }),
        taxGstr3bFiling.findAll({ where: filingWhere, attributes: ["financialYear", "month", "status", "filedAt"], raw: true }),
    ]);
    const key = (fy, m) => `${fy}|${m}`;
    const gstr1Map = new Map(gstr1Rows.map((r) => [key(r.financialYear, r.month), r]));
    const gstr3bMap = new Map(gstr3bRows.map((r) => [key(r.financialYear, r.month), r]));

    const today = iso(new Date());
    return candidates
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.type.localeCompare(b.type))
        .map((c) => {
            const row = (c.type === "GSTR-1" ? gstr1Map : gstr3bMap).get(key(c.financialYear, c.month));
            const filed = row?.status === "filed";
            return {
                type: c.type,
                period: c.period,
                dueDate: c.dueDate,
                status: filed ? "filed" : c.dueDate < today ? "overdue" : "due",
                filedOn: filed ? row.filedAt : null,
            };
        });
};

/**
 * GST summary: registration (GSTIN/PAN from the corporate profile), a per-slab rate
 * breakup + totals card, a monthly taxable/output-GST/ITC/net-payable trend, and the
 * GSTR-1/GSTR-3B Filing Calendar. The output side (taxable / CGST / SGST / IGST, hence
 * output GST) is DERIVED from sales invoices (invoicingV2 line items) in the period. ITC
 * has no invoice-side source (no purchase bills), so it comes from stored gstRateEntries
 * when present (0 otherwise). outputGst = cgst+sgst+igst and netPayable = outputGst-itc.
 */
exports.findGstSummary = asyncHandler(async (p) => {
    const { from, to } = p;

    const invoiceWhere = {
        corporateUserId: p.corporateUserId,
        documentType: "INVOICE",
        status: { [Op.ne]: "CANCELLED" },
    };
    if (from && to) invoiceWhere.invoiceDate = { [Op.between]: [from, to] };
    else if (to) invoiceWhere.invoiceDate = { [Op.lte]: to };
    else if (from) invoiceWhere.invoiceDate = { [Op.gte]: from };

    const [user, invoices, storedRows] = await Promise.all([
        corporateUser.findOne({
            where: { id: p.corporateUserId },
            attributes: ["gstNumber", "panNumber"],
            raw: true,
        }),
        invoicingV2.findAll({ where: invoiceWhere, attributes: ["taxType", "items", "invoiceDate"], raw: true }),
        gstRateEntry.findAll({
            where: { ...ownerWhere(p), isActive: true, ...dateWhere(from, to) },
            attributes: ["rate", "taxable", "itc", "cgst", "sgst", "igst", "txnDate"],
            raw: true,
        }),
    ]);

    // Output side from invoices; stored gstRateEntries add on top (ITC / manual adjustments).
    const rateEntries = [];
    invoices.forEach((inv) => rateEntries.push(...invoiceRateRows(inv)));
    storedRows.forEach((r) =>
        rateEntries.push({ ...r, month: r.txnDate ? String(r.txnDate).slice(0, 7) : null })
    );

    const gstin = user?.gstNumber || null;
    const registration = { gstin, pan: user?.panNumber || panFromGstin(gstin) };

    const returns = await buildFilingReturns(p, from, to, gstin);

    return assembleGstSummary({ from, to, registration, rateEntries, dueDate: gstr3bDueDate(to), returns });
});

// Exposed for unit tests — pure rate-breakup assembly + invoice derivation (no DB).
exports._assembleGstSummary = assembleGstSummary;
exports._invoiceRateRows = invoiceRateRows;

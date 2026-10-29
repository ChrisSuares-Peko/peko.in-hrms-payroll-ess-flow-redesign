const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const balanceSheetEntry = require("../entities/balanceSheetEntry");
const { findAccountsReceivable } = require("./accountsReceivable");
const {
    SECTIONS,
    SECTION_ORDER,
    DEFAULT_HEADS,
    DERIVED_HEADS,
    CONTRA_HEADS,
    ASSET_COMPOSITION,
    LIABILITY_COMPOSITION,
    INVENTORY_HEADS,
    tone,
} = require("../../utils/balanceSheetConfig");

const num = (v) => Number(v) || 0;
const round2 = (v) => Math.round((num(v) + Number.EPSILON) * 100) / 100;
const round1 = (v) => Math.round((num(v) + Number.EPSILON) * 10) / 10;
const toLakh = (v) => `₹${(num(v) / 100000).toFixed(1)}L`;
// Percentages are reported to one decimal (frontend renders them as-is).
const pct = (part, whole) => (whole > 0 ? round1((part / whole) * 100) : 0);
// Debt-to-equity tone -> adverb for the leverage insight narrative.
const LEVERAGE_ADVERB = { healthy: "conservatively", moderate: "moderately", high: "heavily" };

// --- date helpers (Indian FY: Apr 1 - Mar 31) ---
const iso = (d) => d.toISOString().slice(0, 10);
const fyStartOf = (asOf) => {
    const d = new Date(asOf);
    const y = d.getUTCFullYear();
    const startYear = d.getUTCMonth() + 1 >= 4 ? y : y - 1; // months are 0-based
    return `${startYear}-04-01`;
};
const dayBefore = (dateStr) => {
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() - 1);
    return iso(d);
};
// Corporate (+ optional sub-user) scope shared by both tables.
const ownerWhere = (p) => {
    const where = { corporateUserId: p.corporateUserId };
    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    return where;
};

// Ledger scope adds the visibility rule (hidden rows never count in reports).
const txnWhere = (p) => ({ ...ownerWhere(p), isHidden: false });

// Net cash (Income - Expense) over an inclusive date range; the ledger is cash-basis
// so this doubles as the cumulative cash position up to a date.
const netForRange = async (p, from, to) => {
    const where = txnWhere(p);
    if (from && to) where.txnDate = { [Op.between]: [from, to] };
    else if (to) where.txnDate = { [Op.lte]: to };
    else if (from) where.txnDate = { [Op.gte]: from };
    const rows = await accountingTransaction.findAll({
        where,
        attributes: ["type", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
        group: ["type"],
        raw: true,
    });
    let income = 0;
    let expense = 0;
    rows.forEach((r) => {
        if (r.type === "Income") income = num(r.total);
        else expense = num(r.total);
    });
    return income - expense;
};

// Latest stored balance per (section, head) as of `asOf` — entries must be sorted
// asOfDate ASC so the last write for a head wins.
const snapshotHeads = (entries, asOf) => {
    const map = new Map(); // key: `${section}|${head}` -> { section, head, amount }
    entries.forEach((e) => {
        if (e.asOfDate > asOf) return;
        map.set(`${e.section}|${e.head}`, {
            section: e.section,
            head: e.head,
            amount: round2(e.amount),
        });
    });
    return map;
};

// Build the ordered line items + total for one section, merging derived heads with
// the stored snapshot (a stored head overrides the derived value of the same name).
const buildSection = (section, derived, snapshot) => {
    const items = new Map(); // head -> { head, amount, derived }
    // 1) Seed derived heads that belong to this section.
    Object.entries(DERIVED_HEADS).forEach(([head, sec]) => {
        if (sec === section) items.set(head, { head, amount: derived[head] || 0, derived: true });
    });
    // 2) Overlay stored heads (override derived on head clash).
    snapshot.forEach((entry) => {
        if (entry.section !== section) return;
        items.set(entry.head, { head: entry.head, amount: entry.amount, derived: false });
    });

    // Order: known heads first (config order), then any extra heads alphabetically.
    const known = DEFAULT_HEADS[section] || [];
    const order = (h) => {
        const i = known.indexOf(h);
        return i === -1 ? known.length : i;
    };
    const lineItems = [...items.values()]
        .sort((a, b) => order(a.head) - order(b.head) || a.head.localeCompare(b.head))
        .map((li) => ({
            head: li.head,
            amount: li.amount,
            ...(CONTRA_HEADS.has(li.head) ? { isContra: true } : {}),
            ...(li.derived ? { derived: true } : {}),
        }));

    const total = round2(lineItems.reduce((s, li) => s + li.amount, 0));
    return { lineItems, total };
};

// Sum composition buckets over a set of {head, amount}; unmatched -> `otherLabel`.
const composition = (buckets, headAmounts, total, otherLabel) => {
    const claimed = new Set();
    const out = buckets.map((b) => {
        let amount = 0;
        b.heads.forEach((h) => {
            if (headAmounts.has(h)) {
                amount += headAmounts.get(h);
                claimed.add(h);
            }
        });
        return { label: b.label, amount: round2(amount), percent: pct(amount, total) };
    });
    let other = 0;
    headAmounts.forEach((amt, h) => {
        if (!claimed.has(h)) other += amt;
    });
    if (round2(other) !== 0) {
        out.push({ label: otherLabel, amount: round2(other), percent: pct(other, total) });
    }
    return out.filter((r) => r.amount !== 0);
};

// Pure assembly of the as-of snapshot from already-fetched inputs (no DB) — kept
// separate so the statement/ratio/composition math is unit-testable. `entries` are
// the raw balanceSheetEntry rows (asOfDate ASC); `derived` holds the four live heads.
const assembleSnapshot = (asOf, derived, entries) => {
    const snapshot = snapshotHeads(entries, asOf);
    const sections = {};
    SECTION_ORDER.forEach((s) => (sections[s] = buildSection(s, derived, snapshot)));

    const totalCurrentAssets = sections.currentAssets.total;
    const totalNonCurrentAssets = sections.nonCurrentAssets.total;
    const totalAssets = round2(totalCurrentAssets + totalNonCurrentAssets);
    const totalCurrentLiabilities = sections.currentLiabilities.total;
    const totalLongTermLiabilities = sections.longTermLiabilities.total;
    const totalLiabilities = round2(totalCurrentLiabilities + totalLongTermLiabilities);
    const totalEquity = sections.equity.total;
    const totalLiabilitiesAndEquity = round2(totalLiabilities + totalEquity);

    const inventory = sections.currentAssets.lineItems
        .filter((li) => INVENTORY_HEADS.has(li.head))
        .reduce((s, li) => s + li.amount, 0);

    const workingCapital = round2(totalCurrentAssets - totalCurrentLiabilities);
    const currentRatio = totalCurrentLiabilities > 0 ? round2(totalCurrentAssets / totalCurrentLiabilities) : null;
    const quickRatio =
        totalCurrentLiabilities > 0 ? round2((totalCurrentAssets - inventory) / totalCurrentLiabilities) : null;
    const debtToEquity = totalEquity > 0 ? round2(totalLiabilities / totalEquity) : null;

    // Composition lookups (asset heads across both asset sections; liability heads across both).
    const assetHeads = new Map();
    [...sections.currentAssets.lineItems, ...sections.nonCurrentAssets.lineItems].forEach((li) =>
        assetHeads.set(li.head, li.amount)
    );
    const liabilityHeads = new Map();
    [...sections.currentLiabilities.lineItems, ...sections.longTermLiabilities.lineItems].forEach((li) =>
        liabilityHeads.set(li.head, li.amount)
    );

    const fixedAssetsTotal = ASSET_COMPOSITION.find((b) => b.label === "Fixed Assets").heads.reduce(
        (s, h) => s + (assetHeads.get(h) || 0),
        0
    );

    const fixedAssetsPct = pct(fixedAssetsTotal, totalAssets);
    const insights = [
        {
            key: "asset-quality",
            title: "Asset Quality",
            text: `Fixed assets represent ${fixedAssetsPct}% of total assets. ${
                fixedAssetsPct > 35
                    ? "Consider reviewing depreciation schedules and asset utilisation to maximise returns."
                    : "The asset base is well diversified across asset types."
            }`,
        },
        {
            key: "liquidity",
            title: "Liquidity",
            text:
                currentRatio == null
                    ? "No current liabilities recorded, so short-term liquidity ratios are not applicable."
                    : `Current ratio of ${currentRatio} indicates a ${tone.currentRatio(
                          currentRatio
                      )} short-term liquidity position.${
                          quickRatio != null
                              ? ` Quick ratio of ${quickRatio} confirms sufficient liquid asset coverage.`
                              : ""
                      }`,
        },
        {
            key: "leverage",
            title: "Leverage",
            text:
                debtToEquity == null
                    ? "No equity recorded, so leverage cannot be assessed."
                    : `Debt-to-equity ratio of ${debtToEquity}. Business is ${
                          LEVERAGE_ADVERB[tone.debtToEquity(debtToEquity)]
                      } leveraged. Total borrowings stand at ${toLakh(totalLiabilities)}.`,
        },
        {
            key: "working-capital",
            title: "Working Capital",
            text: `Working capital of ${toLakh(workingCapital)} available. ${
                workingCapital > 0
                    ? "Adequate buffer for day-to-day operations and short-term obligations."
                    : "Current liabilities exceed current assets — monitor short-term obligations closely."
            }`,
        },
    ];

    return {
        asOf,
        summary: {
            totalAssets,
            totalLiabilities,
            liabilitiesPctOfAssets: pct(totalLiabilities, totalAssets),
            totalEquity,
            equityPctOfAssets: pct(totalEquity, totalAssets),
            workingCapital,
            workingCapitalTone: tone.workingCapital(workingCapital),
        },
        statement: {
            assets: {
                currentAssets: sections.currentAssets.lineItems,
                totalCurrentAssets,
                nonCurrentAssets: sections.nonCurrentAssets.lineItems,
                totalNonCurrentAssets,
                totalAssets,
            },
            liabilitiesAndEquity: {
                currentLiabilities: sections.currentLiabilities.lineItems,
                totalCurrentLiabilities,
                longTermLiabilities: sections.longTermLiabilities.lineItems,
                totalLongTermLiabilities,
                equity: sections.equity.lineItems,
                totalEquity,
                totalLiabilitiesAndEquity,
            },
        },
        workingCapitalAnalysis: {
            workingCapital: { value: workingCapital, tone: tone.workingCapital(workingCapital) },
            currentRatio: { value: currentRatio, tone: currentRatio == null ? null : tone.currentRatio(currentRatio) },
            quickRatio: { value: quickRatio, tone: quickRatio == null ? null : tone.quickRatio(quickRatio) },
            debtToEquity: { value: debtToEquity, tone: debtToEquity == null ? null : tone.debtToEquity(debtToEquity) },
            currentAssetsVsCurrentLiabilities: {
                currentAssets: totalCurrentAssets,
                currentLiabilities: totalCurrentLiabilities,
            },
        },
        assetComposition: composition(ASSET_COMPOSITION, assetHeads, totalAssets, "Other"),
        liabilityComposition: composition(LIABILITY_COMPOSITION, liabilityHeads, totalLiabilities, "Other Liabilities"),
        insights,
    };
};

// Fetch the derived heads + stored entries for `asOf`, then assemble the snapshot.
const computeSnapshot = async (p, asOf) => {
    const fyStart = fyStartOf(asOf);
    const [cashNet, currentYearProfit, retainedEarnings, ar, entries] = await Promise.all([
        netForRange(p, null, asOf),
        netForRange(p, fyStart, asOf),
        netForRange(p, null, dayBefore(fyStart)),
        findAccountsReceivable({ corporateUserId: p.corporateUserId, to: asOf }),
        balanceSheetEntry.findAll({
            where: { ...ownerWhere(p), isActive: true, asOfDate: { [Op.lte]: asOf } },
            attributes: ["section", "head", "amount", "asOfDate"],
            order: [["asOfDate", "ASC"]],
            raw: true,
        }),
    ]);
    const derived = {
        "Cash & Bank Balance": round2(cashNet),
        "Accounts Receivable": round2(ar?.totals?.outstanding),
        "Retained Earnings": round2(retainedEarnings),
        "Current Year Profit": round2(currentYearProfit),
    };
    return assembleSnapshot(asOf, derived, entries);
};

// Best-effort 12-month trend of total assets / liabilities / equity ending at `asOf`.
// Cash is the real cumulative ledger position per month; stored heads are held at
// their latest snapshot <= each month end; A/R is held at its as-of value. Derived
// retained earnings + current-year profit collapse into the cumulative cash line.
const buildTrend = async (p, asOf) => {
    const end = new Date(asOf);
    // First day of the month 11 months before the as-of month.
    const startMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
    const windowStart = iso(startMonth);

    const [opening, deltas, ar, entries] = await Promise.all([
        netForRange(p, null, dayBefore(windowStart)),
        accountingTransaction.findAll({
            where: { ...txnWhere(p), txnDate: { [Op.between]: [windowStart, asOf] } },
            attributes: [
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("txnDate"), "%Y-%m"), "ym"],
                "type",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            ],
            group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("txnDate"), "%Y-%m"), "type"],
            raw: true,
        }),
        findAccountsReceivable({ corporateUserId: p.corporateUserId, to: asOf }),
        balanceSheetEntry.findAll({
            where: { ...ownerWhere(p), isActive: true, asOfDate: { [Op.lte]: asOf } },
            attributes: ["section", "head", "amount", "asOfDate"],
            order: [["asOfDate", "ASC"]],
            raw: true,
        }),
    ]);

    const deltaByMonth = new Map();
    deltas.forEach((r) => {
        const cur = deltaByMonth.get(r.ym) || 0;
        deltaByMonth.set(r.ym, cur + (r.type === "Income" ? num(r.total) : -num(r.total)));
    });

    const arValue = round2(ar?.totals?.outstanding);
    let cashCum = opening;
    const out = [];
    for (let i = 0; i < 12; i++) {
        const m = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1));
        const ym = `${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, "0")}`;
        const monthEnd = iso(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)));
        cashCum += deltaByMonth.get(ym) || 0;

        const snap = snapshotHeads(entries, monthEnd > asOf ? asOf : monthEnd);
        let storedAssets = 0;
        let storedLiabilities = 0;
        let storedEquity = 0;
        snap.forEach((e) => {
            const side = SECTIONS[e.section].side;
            if (side === "asset") storedAssets += e.amount;
            else if (side === "liability") storedLiabilities += e.amount;
            // Equity heads that duplicate derived RE/CYP are skipped to avoid double count.
            else if (side === "equity" && !DERIVED_HEADS[e.head]) storedEquity += e.amount;
        });

        out.push({
            month: ym,
            assets: round2(cashCum + arValue + storedAssets),
            liabilities: round2(storedLiabilities),
            equity: round2(storedEquity + cashCum),
        });
    }
    return out;
};

/**
 * Balance Sheet "as-of" snapshot built by merging derived heads (cash, A/R, retained
 * earnings, current-year profit) with stored balanceSheetEntries. Because the ledger
 * is cash-basis and partial, Assets need not equal Liabilities + Equity unless the
 * stored heads complete the picture — both totals are reported as-is (never forced).
 */
exports.findBalanceSheet = asyncHandler(async (p) => {
    const asOf = p.asOf;
    const [snapshot, trend] = await Promise.all([
        computeSnapshot(p, asOf),
        buildTrend(p, asOf),
    ]);
    return { ...snapshot, trend };
});

// Exposed for unit tests — pure statement/ratio/composition assembly (no DB).
exports._assembleSnapshot = assembleSnapshot;

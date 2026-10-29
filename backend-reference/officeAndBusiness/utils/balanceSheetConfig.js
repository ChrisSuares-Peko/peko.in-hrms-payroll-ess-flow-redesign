// Configuration for the Balance Sheet report (models/use-cases/balanceSheet.js).
//
// A balance sheet is an "as-of" snapshot of Assets = Liabilities + Equity. Most
// heads cannot be derived from the income/expense ledger, so they are stored in
// balanceSheetEntries; only DERIVED_HEADS are computed live. This file defines the
// section metadata, the default head ordering (matches the UI), the composition
// grouping for the donut charts, and the (documented, tunable) tone thresholds.

// The five sections and which side of the sheet they sit on.
const SECTIONS = {
    currentAssets: { title: "Current Assets", side: "asset", group: "current" },
    nonCurrentAssets: { title: "Non-Current Assets", side: "asset", group: "nonCurrent" },
    currentLiabilities: { title: "Current Liabilities", side: "liability", group: "current" },
    longTermLiabilities: { title: "Long-Term Liabilities", side: "liability", group: "nonCurrent" },
    equity: { title: "Equity", side: "equity", group: "equity" },
};

const SECTION_ORDER = [
    "currentAssets",
    "nonCurrentAssets",
    "currentLiabilities",
    "longTermLiabilities",
    "equity",
];

// Default ordering of heads within each section (drives the statement row order).
// Stored entries whose head is not listed here are appended after the known heads.
const DEFAULT_HEADS = {
    currentAssets: [
        "Cash & Bank Balance",
        "Accounts Receivable",
        "Inventory / Stock",
        "GST Input Tax Credit",
        "Prepaid Expenses",
        "Short-Term Investments",
    ],
    nonCurrentAssets: [
        "Plant & Machinery",
        "Furniture & Fixtures",
        "Vehicles",
        "Computer Equipment",
        "Software Assets",
        "Long-Term Investments",
        "Accumulated Depreciation",
    ],
    currentLiabilities: [
        "Accounts Payable",
        "GST Payable",
        "TDS Payable",
        "Salaries Payable",
        "Short-Term Loans",
        "Accrued Expenses",
    ],
    longTermLiabilities: ["Term Loan", "Long-Term Borrowings"],
    equity: ["Owner's Capital", "Retained Earnings", "Current Year Profit"],
};

// Heads computed live from other data — never entered manually. A stored entry with
// the same (section, head) overrides the derived value.
const DERIVED_HEADS = {
    "Cash & Bank Balance": "currentAssets",
    "Accounts Receivable": "currentAssets",
    "Retained Earnings": "equity",
    "Current Year Profit": "equity",
};

// Heads treated as contra (shown parenthesised, subtracted within their section).
const CONTRA_HEADS = new Set(["Accumulated Depreciation"]);

// Asset-composition buckets (donut). First matching rule wins; unmatched -> "Other".
const ASSET_COMPOSITION = [
    { label: "Cash & Bank", heads: ["Cash & Bank Balance"] },
    { label: "Receivables", heads: ["Accounts Receivable"] },
    { label: "Inventory", heads: ["Inventory / Stock"] },
    {
        label: "Fixed Assets",
        heads: [
            "Plant & Machinery",
            "Furniture & Fixtures",
            "Vehicles",
            "Computer Equipment",
            "Software Assets",
            "Accumulated Depreciation",
        ],
    },
    { label: "Investments", heads: ["Short-Term Investments", "Long-Term Investments"] },
];

// Liability-composition buckets (donut). Equity is excluded.
const LIABILITY_COMPOSITION = [
    { label: "Accounts Payable", heads: ["Accounts Payable"] },
    { label: "Loans", heads: ["Short-Term Loans", "Term Loan", "Long-Term Borrowings"] },
    { label: "Taxes Payable", heads: ["GST Payable", "TDS Payable"] },
];

// Heads counted as "inventory" for the quick-ratio (current assets minus inventory).
const INVENTORY_HEADS = new Set(["Inventory / Stock"]);

// Tone thresholds — documented heuristics, tunable. Return "healthy" | "moderate" | "weak".
const tone = {
    workingCapital: (v) => (v > 0 ? "healthy" : "weak"),
    currentRatio: (v) => (v >= 1.5 ? "healthy" : v >= 1 ? "moderate" : "weak"),
    quickRatio: (v) => (v >= 1 ? "healthy" : v >= 0.7 ? "moderate" : "weak"),
    // Lower debt-to-equity is better.
    debtToEquity: (v) => (v <= 0.5 ? "healthy" : v <= 1 ? "moderate" : "high"),
};

module.exports = {
    SECTIONS,
    SECTION_ORDER,
    DEFAULT_HEADS,
    DERIVED_HEADS,
    CONTRA_HEADS,
    ASSET_COMPOSITION,
    LIABILITY_COMPOSITION,
    INVENTORY_HEADS,
    tone,
};

// Profit & Loss classification for the detailed P&L report.
//
// Accounting `category` is a free-text field (no master table / enum), so we map
// categories to P&L sections by their normalized name against a curated alias
// list. Anything unmatched falls back by transaction type (Income -> Revenue,
// Expense -> Operating Expenses) so no amount is ever dropped and the statement
// always reconciles to net profit. Tune classification by editing the aliases.

// P&L sections and their "natural" sign side. Income-polarity sections treat an
// Income txn as + and an Expense txn as - (a contra, e.g. Discounts & Returns);
// expense-polarity sections do the reverse.
const SECTIONS = {
    revenue:           { title: "Revenue",            totalLabel: "Total Revenue",            polarity: "income" },
    cogs:              { title: "Cost of Goods Sold", totalLabel: "Total COGS",               polarity: "expense" },
    operatingExpenses: { title: "Operating Expenses", totalLabel: "Total Operating Expenses", polarity: "expense" },
    otherIncome:       { title: "Other Income",       totalLabel: "Total Other Income",       polarity: "income" },
    otherExpenses:     { title: "Other Expenses",     totalLabel: "Total Other Expenses",     polarity: "expense" },
    tax:               { title: "Tax",                totalLabel: "Total Tax",                polarity: "expense" },
};

const SECTION_ORDER = ["revenue", "cogs", "operatingExpenses", "otherIncome", "otherExpenses", "tax"];

// Canonical display label -> section, with the aliases matched (case-insensitively)
// against the stored category string. The label itself is also matched.
const CATEGORY_MAP = [
    // Revenue
    { label: "Product Sales",           section: "revenue", aliases: ["product sales", "sales", "product revenue"] },
    { label: "Service Income",          section: "revenue", aliases: ["service income", "services", "service revenue"] },
    { label: "Other Operating Income",  section: "revenue", aliases: ["other operating income", "operating income"] },
    { label: "Discounts & Returns",     section: "revenue", aliases: ["discounts & returns", "discounts and returns", "discounts", "returns", "sales returns"] },
    // Cost of Goods Sold
    { label: "Raw Material Costs",      section: "cogs", aliases: ["raw material costs", "raw materials", "raw material"] },
    { label: "Direct Labour",           section: "cogs", aliases: ["direct labour", "direct labor"] },
    { label: "Manufacturing Expenses",  section: "cogs", aliases: ["manufacturing expenses", "manufacturing"] },
    { label: "Inventory Adjustments",   section: "cogs", aliases: ["inventory adjustments", "inventory adjustment", "inventory"] },
    // Operating Expenses
    { label: "Salaries & Wages",        section: "operatingExpenses", aliases: ["salaries & wages", "salaries and wages", "salary", "salaries", "wages", "payroll"] },
    { label: "Office Rent",             section: "operatingExpenses", aliases: ["office rent", "rent"] },
    { label: "Utilities",               section: "operatingExpenses", aliases: ["utilities", "electricity", "water", "internet"] },
    { label: "Marketing & Advertising", section: "operatingExpenses", aliases: ["marketing & advertising", "marketing and advertising", "marketing", "advertising", "ads"] },
    { label: "Sales Commissions",       section: "operatingExpenses", aliases: ["sales commissions", "commission", "commissions"] },
    { label: "Software Subscriptions",  section: "operatingExpenses", aliases: ["software subscriptions", "software", "subscriptions", "saas"] },
    { label: "Professional Fees",       section: "operatingExpenses", aliases: ["professional fees", "professional", "consulting", "legal", "audit"] },
    { label: "Travel & Transportation", section: "operatingExpenses", aliases: ["travel & transportation", "travel and transportation", "travel", "transportation", "conveyance"] },
    { label: "Office Supplies",         section: "operatingExpenses", aliases: ["office supplies", "supplies", "stationery"] },
    { label: "Insurance",               section: "operatingExpenses", aliases: ["insurance"] },
    { label: "Depreciation",            section: "operatingExpenses", aliases: ["depreciation", "amortization", "amortisation"] },
    // Other Income
    { label: "Interest Income",         section: "otherIncome", aliases: ["interest income", "interest earned"] },
    { label: "Miscellaneous Income",    section: "otherIncome", aliases: ["miscellaneous income", "misc income", "other income"] },
    // Other Expenses
    { label: "Loan Interest",           section: "otherExpenses", aliases: ["loan interest", "interest expense", "interest paid", "emi interest"] },
    { label: "Bank Charges",            section: "otherExpenses", aliases: ["bank charges", "bank fees", "bank charge"] },
    { label: "Miscellaneous Expenses",  section: "otherExpenses", aliases: ["miscellaneous expenses", "misc expenses", "miscellaneous", "sundry expenses"] },
    // Tax (kept out of Other Expenses so Net Profit = PBT - Tax)
    { label: "Income Tax",              section: "tax", aliases: ["income tax", "tax", "corporate tax", "tds"] },
];

// alias / label -> { label, section } lookup, built once.
const ALIAS_INDEX = new Map();
CATEGORY_MAP.forEach((entry) => {
    ALIAS_INDEX.set(entry.label.toLowerCase(), entry);
    entry.aliases.forEach((a) => ALIAS_INDEX.set(a, entry));
});

const normalize = (s) =>
    String(s || "")
        .trim()
        .toLowerCase()
        .replace(/^less:\s*/, "") // "Less: Discounts & Returns" -> "discounts & returns"
        .replace(/\s+/g, " ");

// Classify a (category, type) pair into a P&L section + display label. Unmatched
// categories fall back by type so nothing is dropped from the statement.
const classify = (category, type) => {
    const hit = ALIAS_INDEX.get(normalize(category));
    if (hit) return { section: hit.section, label: hit.label };
    const label = category && category.trim() ? category.trim() : "Uncategorized";
    return { section: type === "Income" ? "revenue" : "operatingExpenses", label };
};

module.exports = { SECTIONS, SECTION_ORDER, CATEGORY_MAP, classify };

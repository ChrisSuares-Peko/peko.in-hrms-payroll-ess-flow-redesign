// Configuration for the Cash Flow Statement report (models/use-cases/cashFlow.js).
//
// Indirect method: the operating section opens with Net Profit (derived live from the
// ledger) and adds non-cash items + working-capital changes. Those adjustments, and the
// whole investing/financing sections, cannot be derived from a cash-basis ledger, so
// their amounts come from stored cashFlowEntries. This template defines the fixed section
// order, titles, net-row labels, and the canonical line-item structure (order +
// subheadings). Stored heads not in the template are appended after the known heads.

// Sign convention: inflow positive, outflow negative (frontend renders negatives in red).
const SECTIONS = [
    {
        key: "operating",
        title: "A. Cash Flow from Operating Activities",
        netLabel: "Net Cash from Operating Activities",
        template: [
            // `isTotal` rows carry a (balance-sheet-derived) amount but are context only —
            // excluded from the "Net Cash from Operating Activities" total.
            { head: "Total Current Assets", derived: "totalCurrentAssets", isTotal: true },
            { head: "Non-Cash Adjustments", isSubheading: true },
            { head: "Add: Depreciation" },
            { head: "Add: Amortisation" },
            { head: "Working Capital Changes", isSubheading: true },
            { head: "Decrease in Accounts Receivable" },
            { head: "Decrease in Inventory" },
            { head: "Increase in Accounts Payable" },
            { head: "GST Receivable / Payable Change" },
            { head: "Other Working Capital Changes" },
            { head: "TOTAL ASSETS", derived: "totalAssets", isTotal: true },
        ],
    },
    {
        key: "investing",
        title: "B. Cash Flow from Investing Activities",
        netLabel: "Net Cash from Investing Activities",
        template: [
            { head: "Purchase of Plant & Machinery" },
            { head: "Purchase of Computer Equipment" },
            { head: "Purchase of Software Assets" },
            { head: "Purchase of Vehicles" },
            { head: "Sale of Old Furniture" },
            { head: "Investment in Fixed Deposits" },
        ],
    },
    {
        key: "financing",
        title: "C. Cash Flow from Financing Activities",
        netLabel: "Net Cash from Financing Activities",
        template: [
            { head: "Capital Introduced by Owner" },
            { head: "Bank Loan Received" },
            { head: "Loan Repayment" },
            { head: "Interest Paid on Loans" },
        ],
    },
];

// Valid section keys for the stored entries (must match the ENUM in the model/migration).
const SECTION_KEYS = SECTIONS.map((s) => s.key);

module.exports = { SECTIONS, SECTION_KEYS };

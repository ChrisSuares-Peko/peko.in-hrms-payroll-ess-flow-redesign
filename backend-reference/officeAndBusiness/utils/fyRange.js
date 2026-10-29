// Indian financial year runs Apr 1 - Mar 31; `fy` is the start calendar year
// (fy=2025 => FY 2025-26). Within an `fy` the range can be narrowed by either a
// `quarter` (1-4: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar of the next
// calendar year) or a `month` (1-12 calendar month; Jan-Mar fall in the next
// calendar year). `month` and `quarter` are mutually exclusive.
//
// Shared by the accounting reports and the transactions list/export so the
// fy/quarter/month -> from/to mapping stays identical everywhere.
const fyDateRange = (fy, quarter, month) => {
    const y = Number(fy);
    if (month) {
        const m = Number(month);
        const cy = m >= 4 ? y : y + 1; // Jan-Mar belong to the next calendar year
        const last = new Date(cy, m, 0).getDate(); // last day of month m
        const mm = String(m).padStart(2, "0");
        return { from: `${cy}-${mm}-01`, to: `${cy}-${mm}-${String(last).padStart(2, "0")}` };
    }
    const ranges = {
        1: [`${y}-04-01`, `${y}-06-30`],
        2: [`${y}-07-01`, `${y}-09-30`],
        3: [`${y}-10-01`, `${y}-12-31`],
        4: [`${y + 1}-01-01`, `${y + 1}-03-31`],
    };
    if (quarter) {
        const [from, to] = ranges[Number(quarter)];
        return { from, to };
    }
    return { from: `${y}-04-01`, to: `${y + 1}-03-31` };
};

module.exports = { fyDateRange };

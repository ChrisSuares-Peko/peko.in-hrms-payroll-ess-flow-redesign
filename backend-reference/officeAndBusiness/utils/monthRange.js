// Enumerate every calendar month (YYYY-MM) in the inclusive [from, to] range, so monthly
// chart series can show 0 for months that have no data instead of skipping them.
// Returns null when the range is unbounded (caller should fall back to sparse/data-only).
const enumerateMonths = (from, to) => {
    if (!from || !to) return null;
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const months = [];
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    // Guard against an inverted range (from > to).
    let guard = 0;
    while ((y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) && guard < 600) {
        months.push(`${y}-${String(m + 1).padStart(2, "0")}`);
        m += 1;
        if (m > 11) {
            m = 0;
            y += 1;
        }
        guard += 1;
    }
    return months;
};

module.exports = { enumerateMonths };

// Verify each row against the running-balance column; flag rows that don't reconcile.
const EPS = 0.01;

function reconcile(openingBalance, txns) {
    let prev = Number(openingBalance) || 0;
    let reconciled = 0;

    const results = (txns || []).map((t) => {
        const amount = Math.abs(Number(t.amount) || 0);
        const balance = Number(t.balance);
        const hasBalance = !Number.isNaN(balance);
        const expected = t.type === "Income" ? prev + amount : prev - amount;
        const ok = hasBalance && Math.abs(expected - balance) < EPS;
        if (ok) reconciled++;
        prev = hasBalance ? balance : expected;
        return { ...t, amount, reconciled: ok };
    });

    const total = results.length;
    return {
        results,
        total,
        reconciled,
        needsReview: total - reconciled,
        qualityScore: total ? Math.round((reconciled / total) * 100) : 0,
        computedClosing: prev,
    };
}

module.exports = { reconcile };

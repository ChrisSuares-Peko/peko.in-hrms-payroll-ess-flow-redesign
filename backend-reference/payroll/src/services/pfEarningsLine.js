// "Show PF Employee's Contribution in Earnings" (Compliance Settings > EPF) — a pure
// presentation choice. When ON, the employee's 12% PF share is also listed as a locked
// line in Earnings, taken out of the Balancing component (Special Allowance), while still
// being deducted exactly as before. Gross, CTC, deductions, tax and take-home never change.
//
// Applied ONLY to what is displayed or snapshotted for a payslip — never to anything that
// is solved from or persisted as a salary structure (see getEmployeeCtcBreakdown's
// includePfEarningsLine). Mirrors the frontend's utils/ctcCalculator/pfEarningsLine.ts —
// keep both in sync.
const PF_EARNINGS_LINE_NAME = "PF Employee's Contribution";

const isPfEarningsLine = (earning) =>
  !!earning && (earning.isPfEarningsLine === true || earning.componentName === PF_EARNINGS_LINE_NAME);

const roundMoney = (amount) => Math.round(amount * 100) / 100;

const findBalancingIndex = (earnings) => {
  const byRole = earnings.findIndex((e) => e.calculationType === 'BALANCING');
  return byRole >= 0 ? byRole : earnings.findIndex((e) => e.componentName === 'Special Allowance');
};

// Removes the line and gives its amount back to the Balancing component — the exact
// inverse of applyPfEarningsLine, so the real structure comes back unchanged.
const stripPfEarningsLine = (earnings) => {
  const list = earnings || [];
  const lineTotal = list.filter(isPfEarningsLine).reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);
  const base = list.filter((e) => !isPfEarningsLine(e));
  const balancingIndex = findBalancingIndex(base);
  if (!lineTotal || balancingIndex < 0) return base;
  return base.map((e, i) =>
    i === balancingIndex ? { ...e, calculatedAmount: roundMoney((e.calculatedAmount || 0) + lineTotal) } : e
  );
};

// Returns a new earnings list with the line placed just before the Balancing component,
// which gives up the same amount. Returned without a line when there's no PF this month,
// no Balancing component, or Balancing can't absorb the full amount — the line must never
// change Gross. Safe to call on a list that already carries the line.
const applyPfEarningsLine = (earnings, employeePfAmount) => {
  const base = stripPfEarningsLine(earnings);
  const amount = roundMoney(Number(employeePfAmount) || 0);
  if (!(amount > 0)) return base;

  const balancingIndex = findBalancingIndex(base);
  if (balancingIndex < 0 || (base[balancingIndex].calculatedAmount || 0) + 0.005 < amount) return base;

  const result = base.map((e, i) =>
    i === balancingIndex ? { ...e, calculatedAmount: roundMoney((e.calculatedAmount || 0) - amount) } : e
  );
  result.splice(balancingIndex, 0, {
    id: 'pf-employee-contribution',
    componentName: PF_EARNINGS_LINE_NAME,
    calculationType: 'FIXED',
    amountPercentage: amount,
    calculatedAmount: amount,
    isPartOfGross: true,
    isPfEarningsLine: true,
  });
  return result;
};

module.exports = { PF_EARNINGS_LINE_NAME, isPfEarningsLine, applyPfEarningsLine, stripPfEarningsLine };

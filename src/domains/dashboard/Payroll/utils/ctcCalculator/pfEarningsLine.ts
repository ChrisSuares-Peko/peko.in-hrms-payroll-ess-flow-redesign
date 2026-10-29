import { CtcEarningComponent } from './types';

// "Show PF Employee's Contribution in Earnings" (Compliance Settings > EPF) — display only.
// When ON, the employee's 12% PF share is also listed as a locked Earnings line, taken out
// of the Balancing component (Special Allowance), and still deducted as before — Gross,
// CTC, deductions and take-home never change. The line is never a real salary component:
// strip it before re-solving or persisting a structure. Mirrors the backend's
// services/pfEarningsLine.js — keep both in sync.
export const PF_EARNINGS_LINE_NAME = "PF Employee's Contribution";

export const isPfEarningsLine = (earning?: Partial<CtcEarningComponent>) =>
    !!earning && (earning.isPfEarningsLine === true || earning.componentName === PF_EARNINGS_LINE_NAME);

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const findBalancingIndex = (earnings: CtcEarningComponent[]) => {
    const byRole = earnings.findIndex(e => e.calculationType === 'BALANCING');
    return byRole >= 0 ? byRole : earnings.findIndex(e => e.componentName === 'Special Allowance');
};

// Removes the line and gives its amount back to the Balancing component — the exact
// inverse of applyPfEarningsLine, so the real structure comes back unchanged.
export const stripPfEarningsLine = (earnings: CtcEarningComponent[]): CtcEarningComponent[] => {
    const list = earnings || [];
    const lineTotal = list.filter(isPfEarningsLine).reduce((sum, e) => sum + (e.calculatedAmount || 0), 0);
    const base = list.filter(e => !isPfEarningsLine(e));
    const balancingIndex = findBalancingIndex(base);
    if (!lineTotal || balancingIndex < 0) return base;
    return base.map((e, i) =>
        i === balancingIndex ? { ...e, calculatedAmount: roundMoney((e.calculatedAmount || 0) + lineTotal) } : e
    );
};

// Adds the line just before the Balancing component, which gives up the same amount.
// No line when there's no PF, no Balancing component, or Balancing can't absorb it all.
export const applyPfEarningsLine = (earnings: CtcEarningComponent[], employeePfAmount: number): CtcEarningComponent[] => {
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

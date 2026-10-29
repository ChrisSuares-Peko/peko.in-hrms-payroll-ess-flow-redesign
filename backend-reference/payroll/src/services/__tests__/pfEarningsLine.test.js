const { applyPfEarningsLine, PF_EARNINGS_LINE_NAME } = require('../pfEarningsLine');
const { isPfInEarningsForPeriod } = require('../calculateEmployerPf');

// Dev Notes worked sample — CTC ₹11,93,400: Basic ₹48,100, HRA ₹24,050, Special Allowance
// ₹24,050, gross ₹96,200; employee PF ₹3,000 (capped at the ₹25,000 ceiling).
const earnings = [
  { componentName: 'Basic Salary', calculationType: 'PERCENTAGE', calculatedAmount: 48100 },
  { componentName: 'House Rent Allowance', calculationType: 'PERCENTAGE', calculatedAmount: 24050 },
  { componentName: 'Special Allowance', calculationType: 'BALANCING', calculatedAmount: 24050 },
];
const gross = (list) => list.reduce((sum, e) => sum + e.calculatedAmount, 0);

describe('applyPfEarningsLine — display-only PF line in Earnings', () => {
  it('adds the line before Special Allowance, which gives up the same amount — gross unchanged', () => {
    const result = applyPfEarningsLine(earnings, 3000);
    expect(result.map((e) => [e.componentName, e.calculatedAmount])).toEqual([
      ['Basic Salary', 48100],
      ['House Rent Allowance', 24050],
      [PF_EARNINGS_LINE_NAME, 3000],
      ['Special Allowance', 21050],
    ]);
    expect(gross(result)).toBe(96200);
  });

  it('never mutates its input and never adds the line twice', () => {
    const once = applyPfEarningsLine(earnings, 3000);
    const twice = applyPfEarningsLine(once, 3000);
    expect(earnings[2].calculatedAmount).toBe(24050);
    expect(twice.filter((e) => e.componentName === PF_EARNINGS_LINE_NAME)).toHaveLength(1);
    expect(gross(twice)).toBe(96200);
  });

  it('leaves earnings as-is with no PF, or when Special Allowance cannot absorb it', () => {
    expect(applyPfEarningsLine(earnings, 0)).toEqual(earnings);
    const smallBalancing = earnings.map((e) => (e.calculationType === 'BALANCING' ? { ...e, calculatedAmount: 2000 } : e));
    expect(applyPfEarningsLine(smallBalancing, 3000)).toEqual(smallBalancing);
  });

  it('finds a renamed Balancing component by its role', () => {
    const renamed = earnings.map((e) => (e.calculationType === 'BALANCING' ? { ...e, componentName: 'Other Allowance' } : e));
    const result = applyPfEarningsLine(renamed, 3000);
    expect(result.find((e) => e.componentName === 'Other Allowance').calculatedAmount).toBe(21050);
  });
});

describe('isPfInEarningsForPeriod', () => {
  it('is OFF by default and always OFF while EPF itself is off', () => {
    expect(isPfInEarningsForPeriod(null)).toBe(false);
    expect(isPfInEarningsForPeriod({ epf: { isApplicable: false, showEmployeePfInEarnings: true } })).toBe(false);
  });

  it('follows the month: paid months keep the line they had', () => {
    const settings = {
      epf: {
        showEmployeePfInEarnings: true,
        earningsLineHistory: [{ showInEarnings: true, effectiveMonth: 10, effectiveYear: 2026, changedAt: '2026-09-24' }],
      },
    };
    expect(isPfInEarningsForPeriod(settings)).toBe(true);
    expect(isPfInEarningsForPeriod(settings, 9, 2026)).toBe(false);
    expect(isPfInEarningsForPeriod(settings, 10, 2026)).toBe(true);
  });
});

const { applyLossOfPay } = require('../../salaryComponent');

const earnings = (basic, hra, special) => [
  { componentName: 'Basic Salary', calculatedAmount: basic, calculationType: 'PERCENTAGE' },
  { componentName: 'House Rent Allowance', calculatedAmount: hra, calculationType: 'PERCENTAGE' },
  { componentName: 'Special Allowance', calculatedAmount: special, calculationType: 'BALANCING' },
];

const deductions = [
  { _id: 'pf', deductionName: 'Provident Fund (PF)', calculationType: 'PERCENTAGE', amountPercentage: 12, calculationBasis: 'MONTHLY' },
  { _id: 'pt', deductionName: 'Professional Tax', calculationType: 'FIXED', amountPercentage: 200, calculationBasis: 'MONTHLY' },
  { _id: 'canteen', deductionName: 'Canteen', calculationType: 'FIXED', amountPercentage: 500, calculationBasis: 'MONTHLY' },
];

const fullDeductions = (pf) => [
  { ...deductions[0], calculatedAmount: pf },
  { ...deductions[1], calculatedAmount: 200 },
  { ...deductions[2], calculatedAmount: 500 },
];

const run = ({ basic, hra, special, pf, lossOfPay }) => applyLossOfPay({
  salaryComponents: earnings(basic, hra, special),
  deductionComponents: deductions,
  fullDeductionComponents: fullDeductions(pf),
  basicSalary: basic,
  grossSalary: basic + hra + special,
  lossOfPay,
  month: 10,
  year: 2026,
});

const amountOf = (list, name) => list.find(c => (c.componentName || c.deductionName) === name).calculatedAmount;
const grossOf = (list) => Math.round(list.reduce((s, c) => s + c.calculatedAmount, 0) * 100) / 100;

describe('applyLossOfPay', () => {
  it('scales every earning by the paid share of the month (Pooja: ₹45,000, 2 of 31 days)', () => {
    const result = run({ basic: 22500, hra: 11250, special: 11250, pf: 2700, lossOfPay: { days: 2, daysInMonth: 31 } });

    expect(grossOf(result.salaryComponents)).toBe(42096.77);
    expect(amountOf(result.salaryComponents, 'Basic Salary')).toBe(21048.39);
    expect(result.lossOfPay.amount).toBe(2903.23);
    expect(amountOf(result.deductionComponents, 'Provident Fund (PF)')).toBe(2526);
  });

  it('uses the typed amount for the paid share when HR overrides it (Suresh: ₹52,500, ₹5,000)', () => {
    const result = run({
      basic: 26250, hra: 13125, special: 13125, pf: 3000,
      lossOfPay: { days: 3, daysInMonth: 31, amount: 5000, isAmountOverridden: true },
    });

    expect(grossOf(result.salaryComponents)).toBe(47500);
    expect(amountOf(result.salaryComponents, 'Basic Salary')).toBe(23750);
    expect(amountOf(result.deductionComponents, 'Provident Fund (PF)')).toBe(2850);
    expect(result.lossOfPay.isAmountOverridden).toBe(true);
  });

  it('keeps PF capped at the full monthly ceiling, not a prorated one', () => {
    const result = run({ basic: 40000, hra: 20000, special: 20000, pf: 3000, lossOfPay: { days: 2, daysInMonth: 31 } });

    expect(amountOf(result.deductionComponents, 'Provident Fund (PF)')).toBe(3000);
  });

  it('leaves Professional Tax and fixed company deductions untouched', () => {
    const result = run({ basic: 22500, hra: 11250, special: 11250, pf: 2700, lossOfPay: { days: 10, daysInMonth: 31 } });

    expect(amountOf(result.deductionComponents, 'Professional Tax')).toBe(200);
    expect(amountOf(result.deductionComponents, 'Canteen')).toBe(500);
  });

  it('returns the full-month figures for the TDS re-estimate', () => {
    const result = run({ basic: 22500, hra: 11250, special: 11250, pf: 2700, lossOfPay: { days: 2, daysInMonth: 31 } });

    expect(result.lossOfPay.fullGross).toBe(45000);
    expect(result.lossOfPay.fullBasic).toBe(22500);
    expect(amountOf(result.lossOfPay.fullDeductionComponents, 'Provident Fund (PF)')).toBe(2700);
  });

  it('never takes more than the month’s gross', () => {
    const result = run({
      basic: 22500, hra: 11250, special: 11250, pf: 2700,
      lossOfPay: { days: 31, daysInMonth: 31, amount: 99999, isAmountOverridden: true },
    });

    expect(result.lossOfPay.amount).toBe(45000);
    expect(grossOf(result.salaryComponents)).toBe(0);
  });

  it('does nothing for zero days', () => {
    expect(run({ basic: 22500, hra: 11250, special: 11250, pf: 2700, lossOfPay: { days: 0, daysInMonth: 31 } })).toBeNull();
  });
});

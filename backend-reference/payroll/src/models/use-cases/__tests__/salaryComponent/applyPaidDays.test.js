const { applyPaidDays } = require('../../salaryComponent');
const { calculateEmployerPfContribution } = require('../../../../services/calculateEmployerPf');

// UAT902 — Uat Midmonth Joiner: joined Mon 13 Oct 2026, monthly gross ₹71,750.
const earnings = () => [
  { componentName: 'Basic Salary', calculatedAmount: 35875, calculationType: 'PERCENTAGE' },
  { componentName: 'House Rent Allowance', calculatedAmount: 17937.5, calculationType: 'PERCENTAGE' },
  { componentName: 'Conveyance Allowance', calculatedAmount: 7175, calculationType: 'FIXED' },
  { componentName: 'Other Allowance', calculatedAmount: 10762.5, calculationType: 'BALANCING' },
];

const deductions = [
  { _id: 'pf', deductionName: 'Provident Fund (PF)', calculationType: 'PERCENTAGE', amountPercentage: 12, calculationBasis: 'MONTHLY' },
  { _id: 'pt', deductionName: 'Professional Tax', calculationType: 'FIXED', amountPercentage: 200, calculationBasis: 'MONTHLY' },
  { _id: 'canteen', deductionName: 'Canteen', calculationType: 'FIXED', amountPercentage: 620, calculationBasis: 'MONTHLY' },
];

const fullDeductions = [
  { ...deductions[0], calculatedAmount: 3000 },
  { ...deductions[1], calculatedAmount: 200 },
  { ...deductions[2], calculatedAmount: 620 },
];

const run = ({ partMonth, lossOfPay }) => applyPaidDays({
  salaryComponents: earnings(),
  deductionComponents: deductions,
  fullDeductionComponents: fullDeductions,
  basicSalary: 35875,
  grossSalary: 71750,
  partMonth,
  lossOfPay,
  month: 10,
  year: 2026,
});

const amountOf = (list, name) => list.find(c => (c.componentName || c.deductionName) === name).calculatedAmount;
const grossOf = (list) => Math.round(list.reduce((s, c) => s + c.calculatedAmount, 0) * 100) / 100;

describe('applyPaidDays — joiner/leaver part month', () => {
  it('prorates every earning on actual days (19 of 31)', () => {
    const result = run({ partMonth: { eligibleDays: 19, daysInMonth: 31 } });

    expect(amountOf(result.salaryComponents, 'Basic Salary')).toBe(21987.9);
    expect(amountOf(result.salaryComponents, 'House Rent Allowance')).toBe(10993.95);
    expect(amountOf(result.salaryComponents, 'Conveyance Allowance')).toBe(4397.58);
    expect(amountOf(result.salaryComponents, 'Other Allowance')).toBe(6596.37);
    expect(grossOf(result.salaryComponents)).toBe(43975.8);
    expect(amountOf(result.deductionComponents, 'Provident Fund (PF)')).toBe(2639);
  });

  it('prorates every earning on company working days (14 of 22, Mon–Fri)', () => {
    const result = run({ partMonth: { eligibleDays: 14, daysInMonth: 22 } });

    expect(amountOf(result.salaryComponents, 'Basic Salary')).toBe(22829.55);
    expect(amountOf(result.salaryComponents, 'House Rent Allowance')).toBe(11414.77);
    expect(amountOf(result.salaryComponents, 'Conveyance Allowance')).toBe(4565.91);
    expect(amountOf(result.salaryComponents, 'Other Allowance')).toBe(6848.86);
    expect(grossOf(result.salaryComponents)).toBe(45659.09);
    expect(amountOf(result.deductionComponents, 'Provident Fund (PF)')).toBe(2740);
  });

  it('works out employer PF on the Basic paid', () => {
    const actual = calculateEmployerPfContribution(21987.9, 'CAPPED_15000', 10, 2026);
    expect(actual).toMatchObject({ pfWage: 21987.9, employeeEpf: 2639, employerEps: 1832, employerEpf: 807, edli: 110, adminCharges: 110, employerTotal: 2859 });

    const working = calculateEmployerPfContribution(22829.55, 'CAPPED_15000', 10, 2026);
    expect(working).toMatchObject({ employeeEpf: 2740, employerEps: 1902, employerEpf: 838, edli: 114, adminCharges: 114, employerTotal: 2968 });
  });

  it('prorates fixed company deductions but not Professional Tax', () => {
    const result = run({ partMonth: { eligibleDays: 19, daysInMonth: 31 } });

    expect(amountOf(result.deductionComponents, 'Canteen')).toBe(380);
    expect(amountOf(result.deductionComponents, 'Professional Tax')).toBe(200);
  });

  it('returns the full-month figures for the TDS re-estimate', () => {
    const result = run({ partMonth: { eligibleDays: 19, daysInMonth: 31 } });

    expect(result.fullGross).toBe(71750);
    expect(result.fullBasic).toBe(35875);
    expect(result.partMonth).toEqual({ eligibleDays: 19, daysInMonth: 31 });
    expect(result.lossOfPay).toBeNull();
  });

  it('charges Loss of Pay inside a part month at the full per-day rate', () => {
    const result = run({ partMonth: { eligibleDays: 19, daysInMonth: 31 }, lossOfPay: { days: 2, daysInMonth: 31 } });

    // 71,750 × (19 − 2) ÷ 31 = 39,346.77; components kept to the paise
    expect(grossOf(result.salaryComponents)).toBe(39346.78);
    expect(result.lossOfPay.amount).toBe(4629.03);
    expect(amountOf(result.deductionComponents, 'Canteen')).toBe(380);
  });

  it('does nothing for a full month', () => {
    expect(run({ partMonth: { eligibleDays: 31, daysInMonth: 31 } })).toBeNull();
  });
});

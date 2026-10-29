const {
  calculateSingleDeductionAmount,
  isProvidentFundDeduction,
  PF_MONTHLY_CAP,
} = require('../../salaryComponent');

describe('isProvidentFundDeduction', () => {
  it('returns true for the exact PF deduction name', () => {
    expect(isProvidentFundDeduction('Provident Fund (PF)')).toBe(true);
  });

  it('returns false for any other deduction name', () => {
    expect(isProvidentFundDeduction('Health Insurance')).toBe(false);
    expect(isProvidentFundDeduction(undefined)).toBe(false);
  });
});

describe('calculateSingleDeductionAmount', () => {
  it('returns the raw amount for a FIXED, MONTHLY deduction', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'FIXED',
      amountPercentage: 500,
      calculationBasis: 'MONTHLY',
    });

    expect(amount).toBe(500);
  });

  it('divides a FIXED, YEARLY deduction by 12', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'FIXED',
      amountPercentage: 1200,
      calculationBasis: 'YEARLY',
    });

    expect(amount).toBe(100);
  });

  it('computes a PERCENTAGE deduction against basic salary by default', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 10,
      calculationBasis: 'MONTHLY',
      basicSalary: 20000,
      grossSalaryBase: 50000,
    });

    expect(amount).toBe(2000);
  });

  it('computes a PERCENTAGE deduction against gross salary when salaryDeductionType is GROSS_SALARY', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 10,
      calculationBasis: 'MONTHLY',
      salaryDeductionType: 'GROSS_SALARY',
      basicSalary: 20000,
      grossSalaryBase: 50000,
    });

    expect(amount).toBe(5000);
  });

  it('divides a PERCENTAGE, YEARLY deduction by 12', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'YEARLY',
      basicSalary: 12000,
    });

    // 12% of 12000 = 1440/yr -> 120/month
    expect(amount).toBe(120);
  });

  it('caps a Provident Fund PERCENTAGE deduction at the ₹1,800 cap for a payroll month before September 2026', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 20000, // 12% of 20000 = 2400, above the ₹15,000-wage-ceiling's ₹1,800 cap
      month: 8,
      year: 2026,
    });

    expect(amount).toBe(PF_MONTHLY_CAP);
  });

  it('caps a Provident Fund PERCENTAGE deduction at the ₹3,000 cap from October 2026 (first full month on the new ceiling)', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 30000, // 12% of 30000 = 3600, above the ₹25,000-wage-ceiling's ₹3,000 cap
      month: 10,
      year: 2026,
    });

    expect(amount).toBe(3000);
  });

  it('does not cap a Provident Fund PERCENTAGE deduction when it is already under the cap for that month', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 10000, // 12% of 10000 = 1200, below either cap
      month: 8,
      year: 2026,
    });

    expect(amount).toBe(1200);
  });

  it('a basic salary that exceeded the old ₹1,800 cap can fall back under the new ₹3,000 cap from October 2026', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 20000, // 12% of 20000 = 2400 — over the old ₹1,800 cap, under the new ₹3,000 one
      month: 10,
      year: 2026,
    });

    expect(amount).toBe(2400);
  });

  it('does not cap a non-PF PERCENTAGE deduction even when it exceeds PF_MONTHLY_CAP', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'PERCENTAGE',
      amountPercentage: 12,
      calculationBasis: 'MONTHLY',
      deductionName: 'Professional Tax',
      basicSalary: 20000, // 12% of 20000 = 2400, above PF_MONTHLY_CAP but this isn't PF
    });

    expect(amount).toBe(2400);
    expect(amount).toBeGreaterThan(PF_MONTHLY_CAP);
  });

  it('self-heals a FIXED PF deduction that was auto-frozen at the old ₹1,800 cap once the payroll month reaches October 2026', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'FIXED',
      amountPercentage: 1800, // frozen back when 12% of a 15,000+ basic hit the old cap
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 25000, // 12% of 25000 = 3000, capped at the new ₹25,000-wage-ceiling's ₹3,000
      month: 10,
      year: 2026,
      globalComponentId: 'auto-frozen-global-component-id',
    });

    expect(amount).toBe(3000);
  });

  it('leaves a FIXED PF deduction unchanged for a payroll month still under the old ceiling, even with a globalComponentId', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'FIXED',
      amountPercentage: 1800,
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 25000,
      month: 8,
      year: 2026,
      globalComponentId: 'auto-frozen-global-component-id',
    });

    expect(amount).toBe(PF_MONTHLY_CAP);
  });

  it('does not self-heal a genuinely bespoke FIXED PF amount that has no globalComponentId', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'FIXED',
      amountPercentage: 1800, // an admin-set one-off amount, not backed by any global template
      calculationBasis: 'MONTHLY',
      deductionName: 'Provident Fund (PF)',
      basicSalary: 25000,
      month: 9,
      year: 2026,
      // no globalComponentId
    });

    expect(amount).toBe(1800);
  });

  it('returns 0 for an unrecognized calculationType', () => {
    const amount = calculateSingleDeductionAmount({
      calculationType: 'UNKNOWN',
      amountPercentage: 100,
    });

    expect(amount).toBe(0);
  });
});

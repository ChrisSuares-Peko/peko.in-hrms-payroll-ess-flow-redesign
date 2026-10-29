const {
  calculateEmployerPfContribution,
  resolvePfWageCeiling,
  resolvePfWage,
  isEpfApplicableForPeriod,
  resolvePfMonthlyCap,
  capPfAmount,
  OLD_PF_WAGE_CEILING,
  NEW_PF_WAGE_CEILING,
} = require('../calculateEmployerPf');

// Payroll-month constants for readability below.
const AUG_2026 = { month: 8, year: 2026 };
const SEP_2026 = { month: 9, year: 2026 };
const OCT_2026 = { month: 10, year: 2026 };

describe('calculateEmployerPfContribution — EPF breakup + date-aware ceiling', () => {
  it('TEST 1: Basic ₹89,025, August 2026 (old ₹15,000 ceiling), capped policy', () => {
    const r = calculateEmployerPfContribution(89025, 'CAPPED_15000', AUG_2026.month, AUG_2026.year);

    expect(r.pfWage).toBe(15000);
    expect(r.employeeEpf).toBe(1800);
    expect(r.employerEps).toBe(1250);
    expect(r.employerEpf).toBe(550);
    expect(r.edli).toBe(75);
    expect(r.adminCharges).toBe(75);
    expect(r.employerTotal).toBe(1950);
    expect(r.total).toBe(1950);
    expect(r.totalDeposit).toBe(3750);
  });

  it('TEST 2: Basic ₹89,025, October 2026 (new ₹25,000 ceiling, full month), capped policy', () => {
    const r = calculateEmployerPfContribution(89025, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);

    expect(r.pfWage).toBe(25000);
    expect(r.employeeEpf).toBe(3000);
    expect(r.employerEps).toBe(2083);
    expect(r.employerEpf).toBe(917);
    expect(r.edli).toBe(125);
    expect(r.adminCharges).toBe(125);
    expect(r.employerTotal).toBe(3250);
    expect(r.totalDeposit).toBe(6250);
  });

  it('TEST 3: Basic ₹20,000, October 2026, capped policy (below the new ceiling)', () => {
    const r = calculateEmployerPfContribution(20000, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);

    expect(r.pfWage).toBe(20000);
    expect(r.employeeEpf).toBe(2400);
    expect(r.employerEps).toBe(1666);
    expect(r.employerEpf).toBe(734);
    expect(r.edli).toBe(100);
    expect(r.adminCharges).toBe(100);
    expect(r.employerTotal).toBe(2600);
    expect(r.totalDeposit).toBe(5000);
  });

  it('TEST 4: Basic ₹10,000, October 2026, capped policy (well below the new ceiling)', () => {
    const r = calculateEmployerPfContribution(10000, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);

    expect(r.pfWage).toBe(10000);
    expect(r.employeeEpf).toBe(1200);
    expect(r.employerEps).toBe(833);
    expect(r.employerEpf).toBe(367);
    expect(r.edli).toBe(50);
    expect(r.adminCharges).toBe(50);
    expect(r.employerEps + r.employerEpf).toBe(1200); // sums back to the rounded 12% total
  });

  it('TEST 5: Basic exactly ₹25,000, October 2026 — PF wage is not capped below itself', () => {
    const r = calculateEmployerPfContribution(25000, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);
    expect(r.pfWage).toBe(25000);
    expect(r.employeeEpf).toBe(3000);
  });

  it('TEST 6: Basic ₹25,001, October 2026 — PF wage is capped at the new ₹25,000 ceiling', () => {
    const r = calculateEmployerPfContribution(25001, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);
    expect(r.pfWage).toBe(25000);
    expect(r.employeeEpf).toBe(3000);
  });

  it('TEST 7: Basic ₹20,000, August 2026 — historical months keep the old ₹15,000 ceiling', () => {
    const r = calculateEmployerPfContribution(20000, 'CAPPED_15000', AUG_2026.month, AUG_2026.year);
    expect(r.pfWage).toBe(15000);
    expect(r.employeeEpf).toBe(1800);
  });

  it('TEST 8: Basic ₹89,025, October 2026 — the new ceiling also applies to months after September', () => {
    const r = calculateEmployerPfContribution(89025, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);
    expect(r.pfWage).toBe(25000);
    expect(r.employeeEpf).toBe(3000);
  });

  it('TEST 9: Employer EPS + Employer EPF always sum exactly to the rounded 12% total (never computed independently as 3.67%)', () => {
    const r = calculateEmployerPfContribution(89025, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);
    const roundedTwelvePercent = Math.round(r.pfWage * 0.12);

    expect(r.employerEps + r.employerEpf).toBe(roundedTwelvePercent);
    expect(r.employerEps).toBe(2083);
    expect(r.employerEpf).toBe(917);
    // The independently-rounded 3.67% figure (₹918) must NOT appear anywhere.
    expect(r.employerEpf).not.toBe(Math.round(r.pfWage * 0.0367));
  });

  it('TEST 10: historical payroll keeps using ₹15,000 even when recalculated/viewed after the 17 September 2026 changeover', () => {
    // Simulates "today" being well after the changeover while still processing/reviewing
    // an August 2026 payroll record — the ceiling must come from the payroll month
    // parameter, never from the current date.
    const historical = calculateEmployerPfContribution(89025, 'CAPPED_15000', AUG_2026.month, AUG_2026.year);
    const current = calculateEmployerPfContribution(89025, 'CAPPED_15000', OCT_2026.month, OCT_2026.year);

    expect(historical.pfWage).toBe(15000);
    expect(historical.employeeEpf).toBe(1800);
    expect(current.pfWage).toBe(25000);
    expect(current.employeeEpf).toBe(3000);
  });

  it('the FULL_BASIC policy is never capped, regardless of month/year', () => {
    const aug = calculateEmployerPfContribution(89025, 'FULL_BASIC', AUG_2026.month, AUG_2026.year);
    const sep = calculateEmployerPfContribution(89025, 'FULL_BASIC', OCT_2026.month, OCT_2026.year);

    expect(aug.pfWage).toBe(89025);
    expect(sep.pfWage).toBe(89025);
    expect(aug.employeeEpf).toBe(Math.round(89025 * 0.12));
  });
});

describe('resolvePfWageCeiling — date-aware, not "today"-aware', () => {
  it('returns the old ceiling for every month through August 2026', () => {
    expect(resolvePfWageCeiling(1, 2026)).toBe(OLD_PF_WAGE_CEILING);
    expect(resolvePfWageCeiling(8, 2026)).toBe(OLD_PF_WAGE_CEILING);
    expect(resolvePfWageCeiling(12, 2025)).toBe(OLD_PF_WAGE_CEILING);
  });

  it('returns the day-weighted ceiling for September 2026 (16 days old + 14 days new)', () => {
    // (16 × 15,000 + 14 × 25,000) / 30 = 19,666.67 → 19,667
    expect(resolvePfWageCeiling(9, 2026)).toBe(19667);
  });

  it('returns the new ceiling from October 2026 onward, including future years', () => {
    expect(resolvePfWageCeiling(10, 2026)).toBe(NEW_PF_WAGE_CEILING);
    expect(resolvePfWageCeiling(1, 2027)).toBe(NEW_PF_WAGE_CEILING);
  });

  it('falls back to the current calendar month/year when none is given (live-preview contexts)', () => {
    const now = new Date();
    const expected = resolvePfWageCeiling(now.getMonth() + 1, now.getFullYear());
    expect(resolvePfWageCeiling()).toBe(expected);
  });
});

describe('resolvePfWage — thin wrapper used by callers that only need the wage, not the breakup', () => {
  it('applies the period-correct ceiling under the capped policy', () => {
    expect(resolvePfWage(89025, 'CAPPED_15000', 8, 2026)).toBe(15000);
    expect(resolvePfWage(89025, 'CAPPED_15000', 9, 2026)).toBe(19667);
    expect(resolvePfWage(89025, 'CAPPED_15000', 10, 2026)).toBe(25000);
  });

  it('never caps under the FULL_BASIC policy', () => {
    expect(resolvePfWage(89025, 'FULL_BASIC', 8, 2026)).toBe(89025);
  });
});

describe('isEpfApplicableForPeriod — establishment EPF switch, month-aware', () => {
  it('defaults to ON for an org that never touched the switch', () => {
    expect(isEpfApplicableForPeriod(null)).toBe(true);
    expect(isEpfApplicableForPeriod({ epf: {} }, 9, 2026)).toBe(true);
  });

  it('with no month, returns the current setting', () => {
    const settings = {
      epf: {
        isApplicable: false,
        applicabilityHistory: [{ isApplicable: false, effectiveMonth: 10, effectiveYear: 2026, changedAt: '2026-09-20' }],
      },
    };
    expect(isEpfApplicableForPeriod(settings)).toBe(false);
  });

  it('keeps already-paid months ON when turned off from the next unpaid month', () => {
    const settings = {
      epf: {
        isApplicable: false,
        applicabilityHistory: [{ isApplicable: false, effectiveMonth: 9, effectiveYear: 2026, changedAt: '2026-09-20' }],
      },
    };
    expect(isEpfApplicableForPeriod(settings, AUG_2026.month, AUG_2026.year)).toBe(true);
    expect(isEpfApplicableForPeriod(settings, SEP_2026.month, SEP_2026.year)).toBe(false);
    expect(isEpfApplicableForPeriod(settings, OCT_2026.month, OCT_2026.year)).toBe(false);
  });

  it('resolves each month to the flip in force for it, latest flip winning', () => {
    const settings = {
      epf: {
        isApplicable: true,
        applicabilityHistory: [
          { isApplicable: false, effectiveMonth: 8, effectiveYear: 2026, changedAt: '2026-08-05' },
          { isApplicable: true, effectiveMonth: 10, effectiveYear: 2026, changedAt: '2026-09-28' },
        ],
      },
    };
    expect(isEpfApplicableForPeriod(settings, 7, 2026)).toBe(true);
    expect(isEpfApplicableForPeriod(settings, AUG_2026.month, AUG_2026.year)).toBe(false);
    expect(isEpfApplicableForPeriod(settings, SEP_2026.month, SEP_2026.year)).toBe(false);
    expect(isEpfApplicableForPeriod(settings, OCT_2026.month, OCT_2026.year)).toBe(true);
    expect(isEpfApplicableForPeriod(settings, 1, 2027)).toBe(true);
  });
});

// New ceiling is effective 17 Sep 2026, so September 2026 is split: 1–16 Sep (16 days) on
// ₹15,000 and 17–30 Sep (14 days) on ₹25,000. PF wage = day-weighted min(Basic, ceiling).
describe('September 2026 — split month (₹15,000 for 1–16 Sep, ₹25,000 for 17–30 Sep)', () => {
  it('Basic ₹89,025 (above both ceilings)', () => {
    const r = calculateEmployerPfContribution(89025, 'CAPPED_15000', SEP_2026.month, SEP_2026.year);

    // (16 × 15,000 + 14 × 25,000) / 30 = 19,666.67 → 19,667
    expect(r.pfWage).toBe(19667);
    expect(r.employeeEpf).toBe(2360);
    expect(r.employerEps).toBe(1638);
    expect(r.employerEpf).toBe(722);
    expect(r.edli).toBe(98);
    expect(r.adminCharges).toBe(98);
    expect(r.employerTotal).toBe(2556);
    expect(r.totalDeposit).toBe(4916);
  });

  it('Basic ₹48,375 (the Salary Profile example) — employee PF ₹2,360, between Aug ₹1,800 and Oct ₹3,000', () => {
    expect(calculateEmployerPfContribution(48375, 'CAPPED_15000', 9, 2026).employeeEpf).toBe(2360);
    expect(capPfAmount(48375 * 0.12, 9, 2026)).toBe(2360);
    expect(capPfAmount(48375 * 0.12, 8, 2026)).toBe(1800);
    expect(capPfAmount(48375 * 0.12, 10, 2026)).toBe(3000);
  });

  it('Basic ₹20,000 (over the old ceiling, under the new one) — each day-range capped separately', () => {
    const r = calculateEmployerPfContribution(20000, 'CAPPED_15000', SEP_2026.month, SEP_2026.year);

    // (16 × 15,000 + 14 × 20,000) / 30 = 17,333.33 → 17,333
    expect(r.pfWage).toBe(17333);
    expect(r.employeeEpf).toBe(2080);
    expect(r.employerEps + r.employerEpf).toBe(2080);
    // capPfAmount must agree with the breakup, not use a single blended cap (which would give 2,360)
    expect(capPfAmount(20000 * 0.12, 9, 2026)).toBe(2080);
  });

  it('Basic ₹10,000 (under both ceilings) — no cap at all, same as any other month', () => {
    const r = calculateEmployerPfContribution(10000, 'CAPPED_15000', SEP_2026.month, SEP_2026.year);
    expect(r.pfWage).toBe(10000);
    expect(r.employeeEpf).toBe(1200);
    expect(capPfAmount(1200, 9, 2026)).toBe(1200);
  });

  it('employee cap for September is ₹2,360', () => {
    expect(resolvePfMonthlyCap(9, 2026)).toBe(2360);
  });

  it('FULL_BASIC is still never capped in September', () => {
    expect(resolvePfWage(89025, 'FULL_BASIC', 9, 2026)).toBe(89025);
  });

  it('non-changeover months are untouched (no rounding introduced)', () => {
    expect(capPfAmount(1234.56, 8, 2026)).toBe(1234.56);
    expect(capPfAmount(1234.56, 10, 2026)).toBe(1234.56);
  });
});

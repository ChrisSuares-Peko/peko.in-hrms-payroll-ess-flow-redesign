const { resolveNonWorkingPayDays, resolvePerDayDivisor } = require('../../utils/dateUtils');

// September 2026: 1 Sep is a Tuesday — 22 working days Mon–Fri.
const cycleStart = new Date('2026-09-01T00:00:00.000Z');
const cycleEnd = new Date('2026-09-30T23:59:59.999Z');
const workingDayPayroll = { calculateSalaryBasedOn: 'COMPANYWORKINGDAYS', selectWorkingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] };
const calendarPayroll = { calculateSalaryBasedOn: 'CALENDARDAYS', selectWorkingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] };

const run = (overrides) => {
  const payrollSettings = overrides.payrollSettings || workingDayPayroll;
  const perDayDivisor = resolvePerDayDivisor(cycleStart, cycleEnd, 30, payrollSettings);
  return resolveNonWorkingPayDays({ cycleStart, cycleEnd, perDayDivisor, payrollSettings, ...overrides });
};

describe('resolveNonWorkingPayDays — non-employed days in the divisor unit', () => {
  it('working-days payroll: joining Mon 28 Sep pays the 3 working days 28/29/30', () => {
    expect(resolvePerDayDivisor(cycleStart, cycleEnd, 30, workingDayPayroll)).toBe(22);
    // Calendar count was 27, which used to wipe out the whole month (min(27, 22) = 22).
    expect(run({ calendarDeductionDays: 27, doj: new Date('2026-09-28T00:00:00.000Z') })).toBe(19);
  });

  it('working-days payroll: leaving on Wed 2 Sep pays 1 and 2 Sep only', () => {
    expect(run({ calendarDeductionDays: 28, doj: new Date('2026-01-01'), lastWorkingDay: new Date('2026-09-02T00:00:00.000Z') })).toBe(20);
  });

  it('working-days payroll: employed the whole cycle deducts nothing', () => {
    expect(run({ calendarDeductionDays: 0, doj: new Date('2025-04-01'), payrollStartsFrom: new Date('2026-01-01') })).toBe(0);
  });

  it('working-days payroll: joining after the cycle deducts the whole cycle', () => {
    expect(run({ calendarDeductionDays: 30, doj: new Date('2026-10-05') })).toBe(22);
  });

  it('working-days payroll: payroll starting mid-cycle counts from the payroll start', () => {
    // Payroll from Mon 14 Sep: 14–30 Sep = 13 working days paid.
    expect(run({ calendarDeductionDays: 13, doj: new Date('2025-04-01'), payrollStartsFrom: new Date('2026-09-14') })).toBe(9);
  });

  it('calendar-days payroll: unchanged — the existing calendar count, capped at the divisor', () => {
    expect(run({ payrollSettings: calendarPayroll, calendarDeductionDays: 27, doj: new Date('2026-09-28') })).toBe(27);
    expect(run({ payrollSettings: calendarPayroll, calendarDeductionDays: 45, doj: new Date('2026-10-28') })).toBe(30);
  });

  it('falls back to the calendar count when no working days are configured', () => {
    expect(run({ payrollSettings: { calculateSalaryBasedOn: 'COMPANYWORKINGDAYS', selectWorkingDays: [] }, calendarDeductionDays: 27, doj: new Date('2026-09-28') })).toBe(27);
  });
});

const { resolvePartMonthDays } = require('../dateUtils');

// October 2026 cycle, as calculateSalaryCycleBasedOnMonth builds it (UTC day bounds).
const cycleStart = new Date('2026-10-01T00:00:00.000Z');
const cycleEnd = new Date('2026-10-31T23:59:59.999Z');
const calendar = { calculateSalaryBasedOn: 'ACTUALDAYS' };
const monToFri = { calculateSalaryBasedOn: 'COMPANYWORKINGDAYS', selectWorkingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] };

const days = (args) => resolvePartMonthDays({ cycleStart, cycleEnd, ...args });

describe('resolvePartMonthDays', () => {
  it('joiner on 13 Oct, actual days: 19 of 31', () => {
    expect(days({ dateOfJoin: new Date('2026-10-13T00:00:00.000Z'), payrollSettings: calendar }))
      .toEqual({ daysInMonth: 31, eligibleDays: 19, unpaidDays: 12 });
  });

  it('reads a joining date stored as IST midnight as the same day', () => {
    expect(days({ dateOfJoin: new Date('2026-10-12T18:30:00.000Z'), payrollSettings: calendar }).eligibleDays).toBe(19);
  });

  it('joiner on 13 Oct, company working days: 14 of 22 (8 Mon–Fri days on 1–12 Oct)', () => {
    expect(days({ dateOfJoin: new Date('2026-10-13T00:00:00.000Z'), payrollSettings: monToFri }))
      .toEqual({ daysInMonth: 22, eligibleDays: 14, unpaidDays: 8 });
  });

  it('weekend joining date is paid from the next working day', () => {
    // Sat 10 Oct and Mon 12 Oct pay the same days under company working days.
    const saturday = days({ dateOfJoin: new Date('2026-10-10T00:00:00.000Z'), payrollSettings: monToFri });
    const monday = days({ dateOfJoin: new Date('2026-10-12T00:00:00.000Z'), payrollSettings: monToFri });
    expect(saturday.eligibleDays).toBe(monday.eligibleDays);
  });

  it('joiner on the 1st is a full month', () => {
    expect(days({ dateOfJoin: new Date('2026-10-01T00:00:00.000Z'), payrollSettings: calendar }).eligibleDays).toBe(31);
  });

  it('leaver: 1st to last working day, inclusive', () => {
    expect(days({ lastWorkingDay: new Date('2026-10-20T00:00:00.000Z'), payrollSettings: calendar }).eligibleDays).toBe(20);
  });

  it('joining and leaving in the same month', () => {
    expect(days({
      dateOfJoin: new Date('2026-10-13T00:00:00.000Z'),
      lastWorkingDay: new Date('2026-10-20T00:00:00.000Z'),
      payrollSettings: calendar,
    }).eligibleDays).toBe(8);
  });

  it('falls back to actual days when no working days are selected', () => {
    expect(days({ dateOfJoin: new Date('2026-10-13T00:00:00.000Z'), payrollSettings: { calculateSalaryBasedOn: 'COMPANYWORKINGDAYS', selectWorkingDays: [] } }))
      .toEqual({ daysInMonth: 31, eligibleDays: 19, unpaidDays: 12 });
  });
});

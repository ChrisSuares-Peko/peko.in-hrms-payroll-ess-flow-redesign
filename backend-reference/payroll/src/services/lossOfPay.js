const Salary = require('../models/entities/salary');
const OrganizationSetting = require('../models/entities/organizationSettings');
require('../models/entities/department');
const ErrorResponse = require('../utils/error-response');
const { processEmpSalary } = require('./salary');
const { getPayrollCycleContext, parseMonthYear } = require('./processSalary');
const {
  findLossOfPayForMonth,
  upsertLossOfPay,
  deleteLossOfPay,
} = require('../models/use-cases/lossOfPay');

// A salary in any of these states has been (or is being) paid out — its LOP is frozen.
// APPROVED is deliberately NOT here: Run Payroll approves the month on open, and HR must
// still be able to correct LOP until the money actually moves.
const LOCKED_STATUSES = new Set(['PAID', 'INITIATED', 'COMPLETED']);

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Full-month gross for the per-day rate. Rows generated before LOP existed have no
// grossBeforeLop; their recorded earnings are the full month then (no LOP could apply).
const resolveGrossBeforeLop = (salary) => {
  if (salary.lossOfPay?.grossBeforeLop > 0) return salary.lossOfPay.grossBeforeLop;
  const info = salary.salaryInformation || {};
  return (info.basicPay || 0) + (info.increamentAmount || 0) + (info.hraAmount || 0)
    + (info.daAmount || 0) + (info.other || 0);
};

const fetchMonthSalaries = ({ corporateUserId, context }) =>
  Salary.find({
    corporateUser: corporateUserId,
    salaryCycleStart: { $gte: new Date(context.cycleStart) },
    salaryCycleEnd: { $lte: new Date(context.cycleEnd) },
  })
    .populate({
      path: 'employee',
      select: 'personalInformation.fullName employeeInformation.employeeId employeeInformation.department isEmployeeDeleted',
      populate: { path: 'employeeInformation.department', select: 'departmentName' },
    })
    .lean();

const buildSheetRow = (salary, lopEntry, fallbackDaysInMonth) => {
  const employee = salary.employee || {};
  const daysInMonth = salary.payDays?.daysInMonth || fallbackDaysInMonth;
  const eligibleDays = salary.payDays?.eligibleDays ?? daysInMonth;
  const grossBeforeLop = resolveGrossBeforeLop(salary);
  const isLocked = LOCKED_STATUSES.has(String(salary.paymentStatus || '').toUpperCase());
  // A locked row shows what was actually paid; an open row shows the sheet's entry.
  const days = isLocked ? (salary.lossOfPay?.days || 0) : (lopEntry?.days || 0);
  const isAmountOverridden = isLocked ? !!salary.lossOfPay?.isAmountOverridden : !!lopEntry?.isAmountOverridden;
  const perDayRate = daysInMonth > 0 ? grossBeforeLop / daysInMonth : 0;
  let amount = 0;
  if (days > 0) {
    if (isLocked) amount = salary.lossOfPay?.amount || 0;
    else amount = isAmountOverridden ? (lopEntry.amount || 0) : roundMoney(perDayRate * days);
  }

  return {
    employeeId: String(employee._id || salary.employee || ''),
    salaryId: String(salary._id),
    employeeName: employee.personalInformation?.fullName || null,
    employeeCode: employee.employeeInformation?.employeeId || null,
    department: employee.employeeInformation?.department?.departmentName || null,
    daysInMonth,
    eligibleDays,
    grossBeforeLop: roundMoney(grossBeforeLop),
    perDayRate: roundMoney(perDayRate),
    days,
    amount: roundMoney(amount),
    isAmountOverridden,
    paymentStatus: salary.paymentStatus || 'N/A',
    isLocked,
  };
};

exports.getLossOfPaySheet = async ({ corporateUserId, month, year }) => {
  const resolved = parseMonthYear({ month, year });
  // Reads the month's existing salary rows rather than regenerating them — running the
  // payroll engine for every employee here made the sheet take seconds to open, and the
  // Salary Details list it is opened from has just regenerated them anyway. Only a month
  // that has never been generated (no rows at all) pays that cost once.
  let context = await getPayrollCycleContext({ corporateUserId, ...resolved, ensureSalaryRows: false });
  let [salaries, lopByEmployee] = await Promise.all([
    fetchMonthSalaries({ corporateUserId, context }),
    findLossOfPayForMonth({ corporateUserID: corporateUserId, ...resolved }),
  ]);
  if (!salaries.length) {
    context = await getPayrollCycleContext({ corporateUserId, ...resolved, ensureSalaryRows: true });
    salaries = await fetchMonthSalaries({ corporateUserId, context });
  }

  const fallbackDaysInMonth = salaries.find(s => s.payDays?.daysInMonth)?.payDays.daysInMonth
    || Math.round((new Date(context.cycleEnd) - new Date(context.cycleStart)) / 86400000) + 1;

  // What "Days in month" counts — the Payroll Cycle setting, same rule as the per-day
  // divisor (resolvePerDayDivisor): company working days only when some are selected.
  const organizationSetting = await OrganizationSetting.findOne({ corporateUser: corporateUserId })
    .select('payrollSettings.calculateSalaryBasedOn payrollSettings.selectWorkingDays')
    .lean();
  const payrollSettings = organizationSetting?.payrollSettings;
  const daysBasis = payrollSettings?.calculateSalaryBasedOn === 'COMPANYWORKINGDAYS'
    && Array.isArray(payrollSettings?.selectWorkingDays) && payrollSettings.selectWorkingDays.length > 0
    ? 'WORKING_DAYS'
    : 'CALENDAR_DAYS';

  const rows = salaries
    .filter(s => s.employee && !s.employee.isEmployeeDeleted)
    .map(s => buildSheetRow(s, lopByEmployee.get(String(s.employee._id)), fallbackDaysInMonth))
    .sort((a, b) => String(a.employeeCode || '').localeCompare(String(b.employeeCode || ''), undefined, { numeric: true }));

  return {
    month: resolved.month,
    year: resolved.year,
    salaryCycle: { salaryCycleStart: context.cycleStart, salaryCycleEnd: context.cycleEnd },
    daysBasis,
    isMonthPaid: rows.length > 0 && rows.every(r => r.isLocked),
    employeesWithLop: rows.filter(r => r.days > 0).length,
    rows,
  };
};

const isHalfDayStep = (value) => Number.isInteger(value * 2);

exports.saveLossOfPaySheet = async ({ corporateUserId, month, year, entries, updatedBy }) => {
  const resolved = parseMonthYear({ month, year });
  if (!Array.isArray(entries)) throw new ErrorResponse('entries must be an array', 400);

  const context = await getPayrollCycleContext({ corporateUserId, ...resolved, ensureSalaryRows: false });
  const [salaries, lopByEmployee] = await Promise.all([
    fetchMonthSalaries({ corporateUserId, context }),
    findLossOfPayForMonth({ corporateUserID: corporateUserId, ...resolved }),
  ]);

  if (!salaries.length) throw new ErrorResponse('There are no employees on payroll for this month', 400);
  if (salaries.every(s => LOCKED_STATUSES.has(String(s.paymentStatus || '').toUpperCase()))) {
    throw new ErrorResponse('Payroll for this month is already paid; Loss of Pay can no longer be changed', 400);
  }

  const salaryByEmployee = new Map(salaries.filter(s => s.employee).map(s => [String(s.employee._id), s]));
  const fallbackDaysInMonth = salaries.find(s => s.payDays?.daysInMonth)?.payDays.daysInMonth || 0;

  // Validate everything before writing anything, so one bad row can't half-apply a sheet.
  const changes = [];
  const errors = [];
  entries.forEach((entry) => {
    const employeeId = String(entry?.employeeId || '');
    const salary = salaryByEmployee.get(employeeId);
    if (!salary) {
      errors.push(`${employeeId || 'Unknown employee'} is not on payroll for this month`);
      return;
    }
    const row = buildSheetRow(salary, lopByEmployee.get(employeeId), fallbackDaysInMonth);
    const label = row.employeeName || row.employeeCode || employeeId;
    const days = Number(entry.days || 0);
    const isAmountOverridden = !!entry.isAmountOverridden && days > 0;
    const existing = lopByEmployee.get(employeeId);

    if (!Number.isFinite(days) || days < 0 || !isHalfDayStep(days)) {
      errors.push(`${label}: LOP days must be zero or more, in half-day steps`);
      return;
    }
    if (days > row.eligibleDays) {
      errors.push(`${label}: LOP days cannot exceed ${row.eligibleDays} days on payroll this month`);
      return;
    }
    let amount = roundMoney(row.perDayRate * days);
    if (isAmountOverridden) {
      amount = roundMoney(entry.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > row.grossBeforeLop) {
        errors.push(`${label}: amount must be between ₹0 and the month's gross of ₹${row.grossBeforeLop}`);
        return;
      }
    }

    const unchanged = existing
      ? existing.days === days && !!existing.isAmountOverridden === isAmountOverridden
        && (!isAmountOverridden || roundMoney(existing.amount) === amount)
      : days === 0;
    if (unchanged) return;

    if (row.isLocked) {
      errors.push(`${label}: salary is already paid; Loss of Pay cannot be changed`);
      return;
    }
    changes.push({ employeeId, days, amount, isAmountOverridden, paymentStatus: salary.paymentStatus });
  });

  if (errors.length) throw new ErrorResponse(errors.join('; '), 400);

  await Promise.all(changes.map(change => (change.days === 0
    ? deleteLossOfPay({ corporateUserID: corporateUserId, employeeId: change.employeeId, ...resolved })
    : upsertLossOfPay({
      corporateUserID: corporateUserId,
      employeeId: change.employeeId,
      ...resolved,
      days: change.days,
      amount: change.amount,
      isAmountOverridden: change.isAmountOverridden,
      updatedBy,
    }))));

  // Recalculate only the employees whose LOP changed, a few at a time — not the whole
  // month. An APPROVED row is recalculated too (it stays APPROVED); see processEmpSalary.
  const RECALC_CONCURRENCY = 5;
  for (let i = 0; i < changes.length; i += RECALC_CONCURRENCY) {
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(changes.slice(i, i + RECALC_CONCURRENCY).map(change => processEmpSalary({
      month: resolved.month,
      year: resolved.year,
      corporateUserID: corporateUserId,
      cycleStart: context.cycleStart,
      cycleEnd: context.cycleEnd,
      payrollStartsFrom: context.payrollStartsFrom,
      salaryCycleDay: context.salaryCycleDay,
      employeeId: change.employeeId,
      recomputeApprovedEmployeeIds: String(change.paymentStatus).toUpperCase() === 'APPROVED' ? [change.employeeId] : [],
    })));
    const failed = results.find(r => !r.status);
    if (failed) throw new ErrorResponse(failed.message || 'Failed to recalculate salaries', 400);
  }

  const sheet = await exports.getLossOfPaySheet({ corporateUserId, ...resolved });
  return { ...sheet, updatedCount: changes.length };
};

/**
 * Salary pre-calculation / synchronisation.
 *
 * The Salary collection is a pre-calculated cache of processEmpSalary's output. Source
 * payroll tables stay the source of input; this module only decides WHEN processEmpSalary
 * runs, never HOW a salary is calculated:
 *
 *  - markSalaryStale        — called after any payroll input changes ($inc staleVersion on
 *                             the affected employees' unpaid rows), then recalculates them
 *                             in the background.
 *  - ensureSalaryRecords    — called by Salary Process reads in place of a full
 *                             processEmpSalary run: only employees whose row is missing or
 *                             not FRESH are recalculated.
 *
 * Set SALARY_SYNC_MODE=legacy to fall back to recalculating everyone on every read.
 */
const Salary = require('../models/entities/salary');
const ErrorResponse = require('../utils/error-response');
const { processEmpSalary, calculateEmpSalaryCycleBasedOnMonth, SALARY_CALC_ENGINE_VERSION } = require('./salary');
const { getSalaryCycleDay, calculateWorkingDays } = require('../models/use-cases/salary');
const { fetchEmployeeIdsForGenerateSalary } = require('../models/use-cases/employee');
const { ensureEpfEnabledWhenMandatory } = require('../models/use-cases/complianceSettings');
const { getContributionPeriodBounds } = require('../models/use-cases/ctcCalculator');
const { markSalaryStale, LOCKED_STATUSES, isSyncEnabled } = require('./salaryStaleMarker');

// Only these are served from cache. processEmpSalary rewrites any other unlocked status
// (INITIATED, FAILD, N/A) back to PENDING/UPCOMING on every run, so those rows keep being
// recalculated on every read exactly as before.
const CACHEABLE_STATUSES = ['PENDING', 'UPCOMING'];

const MAX_AGE_MS = Number(process.env.SALARY_SYNC_MAX_AGE_MINUTES || 1440) * 60 * 1000;
// A row needs at most two runs to settle (see processEmpSalary's calcHash comment).
const MAX_BACKGROUND_PASSES = 3;

const logInfo = (message, meta) => {
  try { console.log(`[salarySync] ${message} ${JSON.stringify(meta)}`); } catch (e) { /* logging must never break payroll */ }
};
const logError = (message, error, meta) => {
  try { console.error(`[salarySync] ${message} ${JSON.stringify({ ...meta, error: error?.message })}`); } catch (e) { /* ignore */ }
};

/**
 * Whether a stored row can be served without recalculating. Besides explicit stale marks,
 * covers the inputs that change with time alone rather than through a write:
 *  - UPCOMING flips to PENDING once the cycle has ended (processEmpSalary's paymentStatus);
 *  - ESI eligibility is resolved against the contribution period containing "now";
 *  - a max age, as a safety net for any input change that isn't hooked.
 */
const isRowFresh = (row, now) => {
  if (!CACHEABLE_STATUSES.includes(row.paymentStatus)) return false;
  // Produced by an older version of the calculation rules.
  if (row.calcEngineVersion !== SALARY_CALC_ENGINE_VERSION) return false;
  if (row.calculatedVersion === null || row.calculatedVersion === undefined) return false;
  if (row.calculatedVersion !== (row.staleVersion || 0)) return false;
  if (!row.calculatedAt) return false;

  const calculatedAt = new Date(row.calculatedAt);
  if (row.paymentStatus === 'UPCOMING' && new Date(row.salaryCycleEnd) < now) return false;
  if (calculatedAt < getContributionPeriodBounds(now).start) return false;
  if (now - calculatedAt > MAX_AGE_MS) return false;
  return true;
};

/**
 * Cycle for a payroll month — same resolution Salary Process has always used (salary
 * cycle day, previous month's cycle end, payroll start date clamp).
 */
exports.resolvePayrollCycle = async ({ corporateUserId, month, year }) => {
  const { salaryCycleDay, payrollStartsFrom, workingDays } = await getSalaryCycleDay(corporateUserId);

  if (!Number.isInteger(salaryCycleDay)) {
    throw new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400);
  }

  let { cycleStart, cycleEnd } = await calculateEmpSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserId);

  const payrollStartDate = payrollStartsFrom ? new Date(payrollStartsFrom) : null;
  const isValidPayrollStart = payrollStartDate instanceof Date && !Number.isNaN(payrollStartDate.getTime());

  if (isValidPayrollStart) {
    if (cycleStart < payrollStartDate && cycleEnd < payrollStartDate) {
      throw new ErrorResponse('There are no employees for this month', 400);
    }
    if (cycleStart < payrollStartDate && cycleEnd > payrollStartDate) {
      cycleStart = payrollStartDate;
    }
  }

  return {
    month,
    year,
    cycleStart,
    cycleEnd,
    salaryCycleDay,
    payrollStartsFrom: payrollStartDate || payrollStartsFrom,
    workingDays,
    workingDaysCount: calculateWorkingDays({ cycleStart, workingDays }),
  };
};

/**
 * Drop-in replacement for a full processEmpSalary({ month, year, corporateUserID,
 * cycleStart, cycleEnd, payrollStartsFrom, salaryCycleDay }) run: recalculates only the
 * eligible employees whose row for this exact cycle is missing or not FRESH. Same return
 * shape as processEmpSalary.
 *
 * Extra options:
 *  - force: recalculate everyone (the old behaviour).
 *  - employeeIds: restrict to these employees.
 *  - createMissing: false to only refresh existing rows (background runs must not create
 *    rows for months nobody has opened).
 */
exports.ensureSalaryRecords = async (params) => {
  const { corporateUserID, month, year, cycleStart, cycleEnd, force = false, employeeIds, createMissing = true, ...rest } = params;
  const baseParams = { corporateUserID, month, year, cycleStart, cycleEnd, ...rest };

  if (!isSyncEnabled() || force) {
    return processEmpSalary(baseParams);
  }

  const startedAt = Date.now();
  try {
    // processEmpSalary runs this on every call; keep that. When it does switch EPF on,
    // setEpfApplicability marks the whole payroll stale, so the check below picks it up.
    await ensureEpfEnabledWhenMandatory(corporateUserID);

    let eligibleIds = await fetchEmployeeIdsForGenerateSalary(corporateUserID, cycleStart, cycleEnd);
    if (Array.isArray(employeeIds)) {
      const wanted = new Set(employeeIds.map(String));
      eligibleIds = eligibleIds.filter(id => wanted.has(String(id)));
    }

    // Exactly the rows processEmpSalary would update (findOneSalaryForReprocessing).
    const rows = await Salary.find({
      corporateUser: corporateUserID,
      year: Number(year),
      month: Number(month),
      salaryCycleStart: cycleStart,
      salaryCycleEnd: cycleEnd,
      employee: { $in: eligibleIds },
    }).select('employee paymentStatus staleVersion calculatedVersion calcEngineVersion calculatedAt salaryCycleEnd').lean();

    const rowsByEmployee = new Map();
    rows.forEach(row => {
      const key = String(row.employee);
      if (!rowsByEmployee.has(key)) rowsByEmployee.set(key, []);
      rowsByEmployee.get(key).push(row);
    });

    const now = new Date();
    const toCalculate = eligibleIds.filter(id => {
      const employeeRows = rowsByEmployee.get(String(id));
      if (!employeeRows) return createMissing;
      return employeeRows
        .filter(row => !LOCKED_STATUSES.includes(row.paymentStatus))
        .some(row => !isRowFresh(row, now));
    });

    const result = toCalculate.length
      ? await processEmpSalary({ ...baseParams, employeeIds: toCalculate })
      : { status: true, message: 'Success' };

    // A later month's cycle / non-working days are derived from the previous month's Salary
    // row (calculateEmpSalaryCycleBasedOnMonth, fetchDeductionDays) — a row created just now
    // can change them, so those employees' later months are recalculated when next read.
    const createdFor = toCalculate.filter(id => !rowsByEmployee.has(String(id)));
    if (createdFor.length) {
      await Salary.updateMany({
        corporateUser: String(corporateUserID),
        employee: { $in: createdFor },
        paymentStatus: { $nin: LOCKED_STATUSES },
        $or: [{ year: { $gt: Number(year) } }, { year: Number(year), month: { $gt: Number(month) } }],
      }, {
        $inc: { staleVersion: 1 },
        $set: { staleAt: new Date(), staleReason: `Previous month (${month}/${year}) generated` },
      });
    }

    logInfo('ensureSalaryRecords', {
      corporateUserID: String(corporateUserID),
      month: Number(month),
      year: Number(year),
      eligible: eligibleIds.length,
      recalculated: toCalculate.length,
      status: result.status,
      ms: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    logError('ensureSalaryRecords failed', error, { corporateUserID: String(corporateUserID), month, year });
    return { status: false, message: error.message };
  }
};

exports.markSalaryStale = markSalaryStale;

/**
 * Creates the current payroll month's Salary row for newly-eligible employees (e.g. right
 * after an employee is created) — what the first Salary Process open would otherwise do.
 */
exports.ensureCurrentMonthSalaryRecords = (corporateUserID) => {
  if (!corporateUserID || !isSyncEnabled()) return;
  setImmediate(async () => {
    try {
      const now = new Date();
      const context = await exports.resolvePayrollCycle({
        corporateUserId: String(corporateUserID),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      await exports.ensureSalaryRecords({
        corporateUserID: String(corporateUserID),
        month: context.month,
        year: context.year,
        cycleStart: context.cycleStart,
        cycleEnd: context.cycleEnd,
        payrollStartsFrom: context.payrollStartsFrom,
        salaryCycleDay: context.salaryCycleDay,
      });
    } catch (error) {
      // Payroll not set up yet / month before payroll start — the row is created on the
      // first Salary Process open instead.
      logError('ensureCurrentMonthSalaryRecords skipped', error, { corporateUserID: String(corporateUserID) });
    }
  });
};

/**
 * Background refresh of rows markSalaryStale just marked (scheduled by salaryStaleMarker).
 * Only refreshes existing rows whose stored cycle is still the month's cycle.
 */
exports.recalculateStaleRows = async (corporateUserID) => {
  const markedSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (let pass = 0; pass < MAX_BACKGROUND_PASSES; pass++) {
    const staleRows = await Salary.find({
      corporateUser: corporateUserID,
      paymentStatus: { $in: CACHEABLE_STATUSES },
      // Only rows an input change just marked — never sweep every historical row that
      // predates pre-calculation; those stay lazy (recalculated when their month is read).
      staleAt: { $gte: markedSince },
      $or: [
        { calculatedVersion: null },
        { $expr: { $ne: ['$calculatedVersion', { $ifNull: ['$staleVersion', 0] }] } },
      ],
    }).select('employee month year').lean();

    if (!staleRows.length) return;

    const employeesByMonth = new Map();
    staleRows.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!employeesByMonth.has(key)) employeesByMonth.set(key, { month: row.month, year: row.year, employeeIds: [] });
      employeesByMonth.get(key).employeeIds.push(row.employee);
    });

    for (const { month, year, employeeIds } of employeesByMonth.values()) {
      let context;
      try {
        context = await exports.resolvePayrollCycle({ corporateUserId: corporateUserID, month, year });
      } catch (error) {
        continue; // left for the read-side fallback
      }
      // Rows whose stored cycle no longer matches the month's cycle aren't touched here —
      // the next Salary Process open of that month handles them exactly as before.
      await exports.ensureSalaryRecords({
        corporateUserID,
        month,
        year,
        cycleStart: context.cycleStart,
        cycleEnd: context.cycleEnd,
        payrollStartsFrom: context.payrollStartsFrom,
        salaryCycleDay: context.salaryCycleDay,
        employeeIds,
        createMissing: false,
      });
    }
  }
};

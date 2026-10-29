/**
 * Marks pre-calculated Salary rows stale after a payroll input changes (see
 * services/salarySync.js for the full picture).
 *
 * Kept free of the salary engine's dependency graph — only the Salary model — so any write
 * site (use-cases, middleware) can require it at load time without circular
 * imports, and a problem in the recalculation code can never break the source write.
 */
const Salary = require('../models/entities/salary');

// processEmpSalary never touches these (services/salary.js step 0 / step 10).
const LOCKED_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];

const BACKGROUND_DELAY_MS = Number(process.env.SALARY_SYNC_BACKGROUND_DELAY_MS || 1500);

const isSyncEnabled = () => process.env.SALARY_SYNC_MODE !== 'legacy';

const logError = (message, error, meta) => {
  try { console.error(`[salarySync] ${message} ${JSON.stringify({ ...meta, error: error?.message })}`); } catch (e) { /* logging must never break payroll */ }
};

// ---- Background recalculation (in-process, debounced per corporate) ----
// Best-effort only: the Salary Process read path (ensureSalaryRecords) recalculates any
// row still stale, so nothing depends on this timer actually firing.
const pendingRecalculations = new Map();

const scheduleBackgroundRecalculation = (corporateUserID) => {
  if (pendingRecalculations.has(corporateUserID)) return;
  const timer = setTimeout(async () => {
    pendingRecalculations.delete(corporateUserID);
    try {
      // eslint-disable-next-line global-require
      await require('./salarySync').recalculateStaleRows(corporateUserID);
    } catch (error) {
      logError('background recalculation failed', error, { corporateUserID });
    }
  }, BACKGROUND_DELAY_MS);
  if (typeof timer.unref === 'function') timer.unref();
  pendingRecalculations.set(corporateUserID, timer);
};

/**
 * Marks the unpaid Salary rows of the given employees (or, without employeeIds, of the
 * whole payroll) as needing recalculation — $inc staleVersion, so a calculation already
 * in flight can't mark them FRESH — then refreshes them in the background.
 * Never throws: the source write it follows has already succeeded; a row that fails to be
 * marked is still picked up by the max-age safety net (salarySync isRowFresh).
 */
exports.markSalaryStale = async ({ corporateUserID, employeeIds, reason, recalculate = true }) => {
  if (!corporateUserID) return 0;
  if (Array.isArray(employeeIds) && employeeIds.length === 0) return 0;

  try {
    const filter = {
      corporateUser: String(corporateUserID),
      paymentStatus: { $nin: LOCKED_STATUSES },
      ...(Array.isArray(employeeIds) ? { employee: { $in: employeeIds } } : {}),
    };
    const result = await Salary.updateMany(filter, {
      $inc: { staleVersion: 1 },
      $set: { staleAt: new Date(), staleReason: reason || null },
    });
    const modifiedCount = result?.modifiedCount || 0;

    if (recalculate && modifiedCount > 0 && isSyncEnabled()) {
      scheduleBackgroundRecalculation(String(corporateUserID));
    }
    return modifiedCount;
  } catch (error) {
    logError('markSalaryStale failed', error, { corporateUserID: String(corporateUserID), reason });
    return 0;
  }
};

exports.LOCKED_STATUSES = LOCKED_STATUSES;
exports.isSyncEnabled = isSyncEnabled;

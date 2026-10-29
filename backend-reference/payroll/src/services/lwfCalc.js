const { scheduleForState, firingMonthsForSchedule, scheduleLabel } = require('../utils/lwfStateSchedule');

const resolveShareAmount = (shareType, shareValue, grossSalary) => {
  if (shareType === 'PERCENT_OF_GROSS') return ((shareValue || 0) / 100) * grossSalary;
  if (shareType === 'FLAT') return shareValue || 0;
  // No per-employee override configured — LWF amounts are per-employee only, there is no
  // org-wide flat-amount default (see ComplianceSettings.laborWelfareFund's own comment).
  return 0;
};

// Single source of truth for "what does this employee's LWF look like, and does it fire
// in a given month" — consumed by both the live payroll run (services/salary.js, which
// passes `month` to gate the actual deduction) and the CTC breakdown (ctcCalculator.js,
// which always shows the configured amount regardless of the current month, per the
// "always-visible row" requirement). Zero-impact for any employee with
// laborWelfareFund: false (today's default) — always returns configured: false.
exports.lwfFor = ({ employee, month, year, complianceSettings, grossSalary }) => {
  const notApplicable = {
    configured: false,
    fires: false,
    employeeAmount: 0,
    employerAmount: 0,
    schedule: null,
    scheduleLabel: null,
    workState: null,
    workStateIsOrgDefault: false,
    nextFireMonth: null,
    nextFireYear: null,
  };

  // Opt-IN, matching the schema default (`laborWelfareFund: { default: false }` on
  // otherConfigurations) and the same "starts inactive" convention Professional Tax uses
  // (see bulkEmployeeCtc.js) — an employee whose document predates this field, or who's
  // simply never had it touched, reads back as `undefined`, not a literal `false`; only an
  // explicit `true` should turn LWF on. `=== false` got this backwards, treating every
  // untouched employee as LWF-configured (amounts computed to ₹0 with no share config set,
  // but the row still showed as configured/Active everywhere — CTC breakdown, Salary
  // Structure tab, the employee's Statutory Components toggle).
  if (employee?.otherConfigurations?.laborWelfareFund !== true) return notApplicable;

  const lwfConfig = employee?.otherConfigurations?.lwf || {};
  const orgLwf = complianceSettings?.laborWelfareFund || {};
  const schedule = lwfConfig.scheduleOverride || scheduleForState(lwfConfig.workState, orgLwf.workState);
  const firingMonths = firingMonthsForSchedule(schedule);
  const fires = month == null ? null : !firingMonths || firingMonths.includes(Number(month));

  // Only meaningful for a non-firing month on a restricted schedule — tells the UI which
  // calendar month the deduction actually resumes in (wrapping into next year once every
  // firing month this year has already passed).
  let nextFireMonth = null;
  let nextFireYear = null;
  if (firingMonths && month != null && year != null) {
    const upcoming = firingMonths.find((m) => m >= Number(month));
    nextFireMonth = upcoming ?? firingMonths[0];
    nextFireYear = upcoming ? Number(year) : Number(year) + 1;
  }

  const employeeAmount = resolveShareAmount(
    lwfConfig.employeeShareType,
    lwfConfig.employeeShareValue,
    grossSalary
  );
  const employerAmount = resolveShareAmount(
    lwfConfig.employerShareType,
    lwfConfig.employerShareValue,
    grossSalary
  );

  return {
    configured: true,
    fires,
    employeeAmount,
    employerAmount,
    schedule,
    scheduleLabel: scheduleLabel(schedule),
    // Resolved state actually driving the schedule above (the employee's own override, or
    // the org default when unset) — distinct from the employee's RAW config (which stays
    // available separately via otherConfigurations.lwf.workState for the edit modal, which
    // must show blank rather than a resolved fallback when nothing's been set yet).
    workState: lwfConfig.workState || orgLwf.workState || null,
    workStateIsOrgDefault: !lwfConfig.workState && !!orgLwf.workState,
    nextFireMonth,
    nextFireYear,
  };
};

// Seeded from the published 2026 state-wise LWF schedules referenced in the Dev Notes —
// flagged there as needing reconciliation with the compliance partner's document before
// being treated as final. Employees can override via otherConfigurations.lwf.scheduleOverride.
const STATE_SCHEDULE = {
  Maharashtra: 'JUNE_DECEMBER',
  Karnataka: 'DECEMBER_ONLY',
  Telangana: 'DECEMBER_ONLY',
  Kerala: 'MONTHLY',
  Punjab: 'MONTHLY',
  Chandigarh: 'MONTHLY',
  // Actually wage-linked (0.2% capped ₹31/month) — simplified here to the flat monthly
  // cycle per the Dev Notes; the wage-linked cap itself isn't modeled yet.
  Haryana: 'MONTHLY',
};

// Falls back to the org's ComplianceSettings.laborWelfareFund.workState when the
// employee's own work state isn't set or isn't in the table — every employee with no
// work state configured resolves through the org default, not a hard failure.
exports.scheduleForState = (workState, orgWorkState) => {
  if (STATE_SCHEDULE[workState]) return STATE_SCHEDULE[workState];
  if (STATE_SCHEDULE[orgWorkState]) return STATE_SCHEDULE[orgWorkState];
  return 'MONTHLY';
};

// Months (1-12) LWF actually deducts for a given schedule.
exports.firingMonthsForSchedule = (schedule) => {
  if (schedule === 'JUNE_DECEMBER') return [6, 12];
  if (schedule === 'DECEMBER_ONLY') return [12];
  return null; // MONTHLY — fires every month, no specific list needed
};

exports.scheduleLabel = (schedule) => {
  if (schedule === 'JUNE_DECEMBER') return 'with the June & December payrolls only';
  if (schedule === 'DECEMBER_ONLY') return 'with the December payroll only';
  return 'monthly';
};

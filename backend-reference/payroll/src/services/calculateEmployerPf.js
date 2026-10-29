// Statutory EPF wage ceiling. ₹15,000/month through 16 September 2026; ₹25,000/month from
// 17 September 2026 (EPFO revision, PIB release 16 Sep 2026). September 2026 itself is
// therefore SPLIT by days — 1–16 Sep on ₹15,000, 17–30 Sep on ₹25,000 — so its PF wage is
// the day-weighted blend of min(Basic, ceiling) across both parts. Which ceiling applies
// is always driven by the PAYROLL MONTH/YEAR being calculated, never by "today's date" —
// so reprocessing or viewing August 2026 (or earlier) keeps using ₹15,000 even after the
// changeover, and only October 2026 onward is fully on ₹25,000.
const OLD_PF_WAGE_CEILING = 15000;
const NEW_PF_WAGE_CEILING = 25000;
const NEW_CEILING_EFFECTIVE_YEAR = 2026;
const NEW_CEILING_EFFECTIVE_MONTH = 9; // September
const NEW_CEILING_EFFECTIVE_DAY = 17;

const EPF_EMPLOYEE_RATE = 0.12;
const EPF_EMPLOYER_TOTAL_RATE = 0.12; // employer's total EPF-side share, before splitting into EPS + Employer EPF
const EPS_RATE = 0.0833;
const EDLI_RATE = 0.005;
const ADMIN_CHARGE_RATE = 0.005;

// Splits a payroll month/year (1-12, calendar year) into the day-ranges each ceiling
// covers — a single segment for every month except the changeover month (September
// 2026), which gets 16 days on the old ceiling and the rest on the new one. Falls back to
// the CURRENT calendar month/year when no period is given — correct for "live preview"
// contexts (CTC Calculator, Add Employee, Revise Salary preview) that represent "if set
// up right now", as distinct from processing/viewing a specific historical payroll month,
// which must always pass its own month/year explicitly.
const getPfWageCeilingSegments = (month, year) => {
  let numMonth = Number(month);
  let numYear = Number(year);
  if (!numMonth || !numYear) {
    const now = new Date();
    numMonth = now.getMonth() + 1;
    numYear = now.getFullYear();
  }
  const isBefore =
    numYear < NEW_CEILING_EFFECTIVE_YEAR ||
    (numYear === NEW_CEILING_EFFECTIVE_YEAR && numMonth < NEW_CEILING_EFFECTIVE_MONTH);
  if (isBefore) return { segments: [{ ceiling: OLD_PF_WAGE_CEILING, days: 1 }], totalDays: 1 };

  const isChangeoverMonth = numYear === NEW_CEILING_EFFECTIVE_YEAR && numMonth === NEW_CEILING_EFFECTIVE_MONTH;
  if (!isChangeoverMonth) return { segments: [{ ceiling: NEW_PF_WAGE_CEILING, days: 1 }], totalDays: 1 };

  const totalDays = new Date(numYear, numMonth, 0).getDate();
  const oldDays = NEW_CEILING_EFFECTIVE_DAY - 1;
  return {
    segments: [
      { ceiling: OLD_PF_WAGE_CEILING, days: oldDays },
      { ceiling: NEW_PF_WAGE_CEILING, days: totalDays - oldDays },
    ],
    totalDays,
  };
};

// Day-weighted average of fn(ceiling) across the month's segments — for a single-segment
// month this is exactly fn(ceiling), so non-changeover months are untouched.
const blendAcrossSegments = (month, year, fn) => {
  const { segments, totalDays } = getPfWageCeilingSegments(month, year);
  if (segments.length === 1) return fn(segments[0].ceiling);
  return Math.round(segments.reduce((sum, s) => sum + s.days * fn(s.ceiling), 0) / totalDays);
};

// The PF wage ceiling in force for a payroll month — ₹15,000 through August 2026,
// ₹25,000 from October 2026, and the day-weighted ₹19,667 for September 2026.
const resolvePfWageCeiling = (month, year) => blendAcrossSegments(month, year, (ceiling) => ceiling);

const resolvePfWage = (basicSalary, policy, month, year) =>
  policy === 'FULL_BASIC'
    ? basicSalary
    : blendAcrossSegments(month, year, (ceiling) => Math.min(basicSalary, ceiling));

// The employee-side cap expressed in rupees (12% of the period-correct wage ceiling) —
// ₹1,800/month through August 2026, ₹2,360 for September 2026, ₹3,000/month from
// October 2026 onward.
const resolvePfMonthlyCap = (month, year) => Math.round(resolvePfWageCeiling(month, year) * EPF_EMPLOYEE_RATE);

// Caps an already-computed employee PF amount at the period's statutory limit. Use this
// rather than Math.min(amount, resolvePfMonthlyCap(...)): in the split changeover month the
// cap has to be applied to each day-range separately (e.g. Basic ₹20,000 is over the old
// ₹15,000 ceiling but under the new ₹25,000 one), which a single blended cap can't do.
const capPfAmount = (amount, month, year) =>
  blendAcrossSegments(month, year, (ceiling) => Math.min(amount, Math.round(ceiling * EPF_EMPLOYEE_RATE)));

// Full EPF contribution breakup, account-wise — not a single employer lump sum. The
// employer's 12% share splits into EPS (pension, A/c 10) and Employer EPF (A/c 1): EPS is
// rounded FIRST, and Employer EPF is the REMAINDER of the rounded 12% total minus that
// rounded EPS — never an independently-rounded 3.67% — because rounding EPS and 3.67%
// separately can leave them not summing back to the rounded 12% total.
const calculateEmployerPfContribution = (basicSalary, policy, month, year) => {
  const ceiling = resolvePfWageCeiling(month, year);
  const pfWage = resolvePfWage(basicSalary, policy, month, year);

  const employeeEpf = Math.round(pfWage * EPF_EMPLOYEE_RATE);

  const employerTotalShare = Math.round(pfWage * EPF_EMPLOYER_TOTAL_RATE);
  const employerEps = Math.round(pfWage * EPS_RATE);
  const employerEpf = employerTotalShare - employerEps;

  const edli = Math.round(pfWage * EDLI_RATE);
  const adminCharges = Math.round(pfWage * ADMIN_CHARGE_RATE);

  const employerTotal = employerEps + employerEpf + edli + adminCharges;
  const totalDeposit = employeeEpf + employerTotal;

  return {
    pfWage,
    ceiling,
    employeeEpf,
    employerEps,
    employerEpf,
    edli,
    adminCharges,
    employerTotal,
    totalDeposit,
    // Kept for existing callers built around the old lump-sum shape (they only ever read
    // .pfWage and .total) — `total` now correctly means the FULL employer side (EPS +
    // Employer EPF + EDLI + Admin), not just the old 12% + 1%.
    total: employerTotal,
  };
};

// pfWagesPolicy is the canonical signal (set by the current EPF settings form). Orgs
// saved before that field existed only have the legacy free-text employerContributionRate
// string (e.g. '12% of Basic Salary' or 'Restrict Contribution to ₹15000 of PF Wage') —
// fall back to parsing that instead of requiring a data migration. Mirrors the frontend's
// own copy (utils/ctcCalculator/calculateEmployerPf.ts) — keep both in sync.
const resolveEpfPolicyFromComplianceSettings = (complianceSettings) => {
  const policy = complianceSettings?.epf?.pfWagesPolicy;
  if (policy === 'CAPPED_15000' || policy === 'FULL_BASIC') return policy;

  const rate = complianceSettings?.epf?.employerContributionRate || '';
  return rate.includes('Basic Salary') ? 'FULL_BASIC' : 'CAPPED_15000';
};

// Whether EPF applies to the establishment at all (Compliance Settings > EPF > "EPF
// applies to this establishment"). Default ON — only an explicit `false` turns it off, so
// every org saved before this switch existed keeps EPF exactly as before.
//
// With no month/year this is the CURRENT setting — correct for live views (Salary
// Structure tab, CTC Calculator, Statutory tab), which show "as configured right now".
// With a month/year it resolves the setting in force for THAT payroll month from
// applicabilityHistory: each flip only takes effect from the first month with no payroll
// run recorded (see setEpfApplicability), so already-paid months keep what they had.
// Among flips effective on/before the month, the most recently made one wins.
// Shared by both EPF switches: the current value when no month is given, otherwise the
// flip in force for that month (latest-made among those effective on/before it), falling
// back to the switch's default for a month before any flip took effect.
const resolveSwitchForPeriod = ({ current, history, month, year, valueOf, defaultBeforeFirstFlip }) => {
  if (!month || !year) return current;
  if (!history || history.length === 0) return current;

  const periodKey = Number(year) * 12 + Number(month);
  const inForce = history
    .filter((h) => h.effectiveYear * 12 + h.effectiveMonth <= periodKey)
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))[0];
  return inForce ? valueOf(inForce) : defaultBeforeFirstFlip;
};

const isEpfApplicableForPeriod = (complianceSettings, month, year) => {
  const epf = complianceSettings?.epf;
  return resolveSwitchForPeriod({
    current: epf?.isApplicable !== false,
    history: epf?.applicabilityHistory,
    month,
    year,
    valueOf: (h) => h.isApplicable !== false,
    // No flip effective yet for this month — EPF was still on its default (ON) back then.
    defaultBeforeFirstFlip: true,
  });
};

// "Show PF Employee's Contribution in Earnings" — default OFF, display only (see
// services/pfEarningsLine.js). Same month-aware timing as the EPF switch; meaningless (so
// always false) for a month in which EPF itself doesn't apply.
const isPfInEarningsForPeriod = (complianceSettings, month, year) => {
  if (!isEpfApplicableForPeriod(complianceSettings, month, year)) return false;
  const epf = complianceSettings?.epf;
  return resolveSwitchForPeriod({
    current: epf?.showEmployeePfInEarnings === true,
    history: epf?.earningsLineHistory,
    month,
    year,
    valueOf: (h) => h.showInEarnings === true,
    defaultBeforeFirstFlip: false,
  });
};

module.exports = {
  OLD_PF_WAGE_CEILING,
  NEW_PF_WAGE_CEILING,
  NEW_CEILING_EFFECTIVE_YEAR,
  NEW_CEILING_EFFECTIVE_MONTH,
  NEW_CEILING_EFFECTIVE_DAY,
  getPfWageCeilingSegments,
  resolvePfWageCeiling,
  resolvePfWage,
  resolvePfMonthlyCap,
  capPfAmount,
  calculateEmployerPfContribution,
  resolveEpfPolicyFromComplianceSettings,
  isEpfApplicableForPeriod,
  isPfInEarningsForPeriod,
};

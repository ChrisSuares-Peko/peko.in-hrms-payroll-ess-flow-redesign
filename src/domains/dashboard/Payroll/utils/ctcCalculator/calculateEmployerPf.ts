import { CtcEmployerPf, PfWagePolicy } from './types';
import { EpfApplicability } from '../../types/complianceSettings/complianceSettingsType';

// Statutory EPF wage ceiling. ₹15,000/month through 16 September 2026; ₹25,000/month from
// 17 September 2026 (EPFO revision). September 2026 itself is SPLIT by days — 1–16 Sep on
// ₹15,000, 17–30 Sep on ₹25,000 — so its PF wage is the day-weighted blend of
// min(Basic, ceiling) across both parts. Which ceiling applies is always driven by the
// PAYROLL MONTH/YEAR being calculated, never by "today's date" — mirrors the backend's
// services/calculateEmployerPf.js exactly, keep both in sync.
export const OLD_PF_WAGE_CEILING = 15000;
export const NEW_PF_WAGE_CEILING = 25000;
export const NEW_CEILING_EFFECTIVE_YEAR = 2026;
export const NEW_CEILING_EFFECTIVE_MONTH = 9; // September
export const NEW_CEILING_EFFECTIVE_DAY = 17;

export const EPF_EMPLOYEE_RATE = 0.12;
export const EPF_EMPLOYER_TOTAL_RATE = 0.12;
export const EPS_RATE = 0.0833;
export const EDLI_RATE = 0.005;
export const ADMIN_CHARGE_RATE = 0.005;

// Splits a payroll month/year (1-12, calendar year) into the day-ranges each ceiling
// covers — a single segment for every month except the changeover month (September 2026).
// Falls back to the CURRENT calendar month/year when no period is given — correct for
// "live preview" contexts (CTC Calculator, Add Employee, Revise Salary preview), which
// represent "if set up right now", as distinct from viewing a specific historical month.
export const getPfWageCeilingSegments = (month?: number | null, year?: number | null) => {
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
const blendAcrossSegments = (
    month: number | null | undefined,
    year: number | null | undefined,
    fn: (ceiling: number) => number
) => {
    const { segments, totalDays } = getPfWageCeilingSegments(month, year);
    if (segments.length === 1) return fn(segments[0].ceiling);
    return Math.round(segments.reduce((sum, s) => sum + s.days * fn(s.ceiling), 0) / totalDays);
};

// The PF wage ceiling in force for a payroll month — ₹15,000 through August 2026,
// ₹25,000 from October 2026, and the day-weighted ₹19,667 for September 2026.
export const resolvePfWageCeiling = (month?: number | null, year?: number | null): number =>
    blendAcrossSegments(month, year, ceiling => ceiling);

export const resolvePfWage = (
    basicSalary: number,
    policy: PfWagePolicy,
    month?: number | null,
    year?: number | null
) =>
    policy === 'FULL_BASIC'
        ? basicSalary
        : blendAcrossSegments(month, year, ceiling => Math.min(basicSalary, ceiling));

// The employee-side cap expressed in rupees (12% of the period-correct wage ceiling) —
// ₹1,800/month through August 2026, ₹2,360 for September 2026, ₹3,000/month from
// October 2026 onward.
export const resolvePfMonthlyCap = (month?: number | null, year?: number | null) =>
    Math.round(resolvePfWageCeiling(month, year) * EPF_EMPLOYEE_RATE);

// Caps an already-computed employee PF amount at the period's statutory limit — applied
// per day-range in the split changeover month, which a single blended cap can't do.
export const capPfAmount = (amount: number, month?: number | null, year?: number | null) =>
    blendAcrossSegments(month, year, ceiling => Math.min(amount, Math.round(ceiling * EPF_EMPLOYEE_RATE)));

// Full EPF contribution breakup, account-wise — not a single employer lump sum. The
// employer's 12% share splits into EPS (pension, A/c 10) and Employer EPF (A/c 1): EPS is
// rounded FIRST, and Employer EPF is the REMAINDER of the rounded 12% total minus that
// rounded EPS — never an independently-rounded 3.67% — because rounding EPS and 3.67%
// separately can leave them not summing back to the rounded 12% total.
export const calculateEmployerPfContribution = (
    basicSalary: number,
    policy: PfWagePolicy,
    month?: number | null,
    year?: number | null
): CtcEmployerPf => {
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
        adminEdli: edli + adminCharges,
        total: employerTotal,
    };
};

// Mirrors the backend's resolveEpfPolicyFromComplianceSettings (services/calculateEmployerPf.js).
// pfWagesPolicy is the canonical signal; orgs saved before that field existed only have the
// free-text employerContributionRate string (e.g. '12% of Basic Salary' or 'Restrict
// Contribution to ₹15000 of PF Wage') — fall back to parsing that instead of a migration.
// "EPF applies to this establishment" (Compliance Settings > EPF) — the current setting.
// Default ON: only an explicit `false` turns it off. Every client-side solve here is a
// live "if set up right now" preview, which is exactly what the current setting governs
// (a flip takes effect from the first unpaid month) — mirrors the backend's
// isEpfApplicableForPeriod called without a month.
export const resolveEpfApplicableFromComplianceSettings = (complianceData: any): boolean =>
    complianceData?.epf?.isApplicable !== false;

// "Show PF Employee's Contribution in Earnings" — display only, default OFF, and never
// shown while EPF itself doesn't apply (pass the caller's resolved epfApplicable, which may
// already account for EPF becoming mandatory with new joiners).
export const resolveShowPfInEarningsFromComplianceSettings = (complianceData: any, epfApplicable: boolean): boolean =>
    epfApplicable && complianceData?.epf?.showEmployeePfInEarnings === true;

// For a CTC being set up for people about to JOIN the payroll: EPF is mandatory from 20
// employees, and the backend switches it back on automatically (ensureEpfEnabledWhenMandatory)
// the moment these joiners take the establishment there — so price them with PF already.
export const willEpfBecomeMandatory = (applicability: EpfApplicability | undefined, joiningCount: number): boolean =>
    !!applicability &&
    !applicability.isApplicable &&
    applicability.activeEmployeeCount + joiningCount >= applicability.mandatoryThreshold;

export const resolveEpfApplicableForJoiners = (
    complianceData: any,
    applicability: EpfApplicability | undefined,
    joiningCount: number
): boolean =>
    resolveEpfApplicableFromComplianceSettings(complianceData) || willEpfBecomeMandatory(applicability, joiningCount);

export const resolveEpfPolicyFromComplianceSettings = (complianceData: any): PfWagePolicy => {
    const policy = complianceData?.epf?.pfWagesPolicy;
    if (policy === 'CAPPED_15000' || policy === 'FULL_BASIC') return policy;

    const rate: string = complianceData?.epf?.employerContributionRate || '';
    return rate.includes('Basic Salary') ? 'FULL_BASIC' : 'CAPPED_15000';
};

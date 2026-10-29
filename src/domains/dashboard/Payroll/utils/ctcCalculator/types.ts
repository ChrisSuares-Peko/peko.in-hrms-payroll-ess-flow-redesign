export type CtcCalculationType = 'FIXED' | 'PERCENTAGE' | 'BALANCING';
export type CtcCalculationBasis = 'COMPONENT' | 'BASIC_SALARY' | 'GROSS_SALARY' | 'CTC';
export type CtcDeductionBasis = 'BASIC_SALARY' | 'GROSS_SALARY';
export type PfWagePolicy = 'CAPPED_15000' | 'FULL_BASIC';

export interface CtcEarningComponent {
    id: string;
    componentName: string;
    calculationType: CtcCalculationType;
    calculationBasis?: CtcCalculationBasis;
    calculationBasedOn?: string;
    amountPercentage?: number;
    calculatedAmount: number;
    isGlobal?: boolean;
    // When false, this earning still counts toward CTC but is excluded from Gross
    // Salary/ESI wages/Labour-Code gross/monthly TDS and never paid in the monthly
    // payroll run — a CTC benefit that sits outside Gross. Defaults to true.
    isPartOfGross?: boolean;
    // The display-only "PF Employee's Contribution" Earnings line (see pfEarningsLine.ts) —
    // locked, never a real component, never persisted or re-solved from.
    isPfEarningsLine?: boolean;
    // Present when this earning overrides a global template — the template's ORIGINAL
    // rule (e.g. "50% of Gross"), for re-solving from org policy during a revision rather
    // than whatever rupee amount got frozen into the override at hire time. See
    // calculateCtcBreakdown.ts's effectiveRule for how it's used.
    globalRule?: {
        calculationType: CtcCalculationType;
        calculationBasis?: CtcCalculationBasis;
        // The referenced COMPONENT-basis base earning's NAME (not id) — a global
        // template's calculationBasedOn points at another GLOBAL component's id, which
        // doesn't match that component's employee-facing overridden id, so the backend
        // resolves it to a stable name instead. See calculateCtcBreakdown.ts's effectiveRule.
        calculationBasedOnName?: string | null;
        amountPercentage?: number;
    };
}

export interface CtcDeductionComponent {
    id: string;
    deductionName: string;
    calculationType: 'FIXED' | 'PERCENTAGE';
    salaryDeductionType?: CtcDeductionBasis;
    amountPercentage?: number;
    calculatedAmount: number;
    isGlobal?: boolean;
}

export interface CtcEmployerPf {
    pfWage: number;
    // The statutory PF wage ceiling actually applied for this figure — ₹15,000 through
    // August 2026, ₹25,000 from September 2026 onward. Lets a caller show "capped at ₹X"
    // without hardcoding either number.
    ceiling: number;
    employeeEpf: number; // A/c 1 (employee side)
    employerEps: number; // A/c 10 — Pension
    employerEpf: number; // A/c 1 (employer side) — remainder of rounded 12% after EPS
    edli: number; // A/c 21
    adminCharges: number; // A/c 2
    employerTotal: number; // employerEps + employerEpf + edli + adminCharges
    totalDeposit: number; // employeeEpf + employerTotal
    // Kept for any caller still built around the old lump-sum shape — equals employerTotal.
    adminEdli: number;
    total: number;
}

// View CTC only (forward calc from an employee's real persisted data) — the reverse-solve
// Calculator/Add Employee engine intentionally never computes this, per the Dev Notes:
// ESI eligibility is derived automatically from gross (with contribution-period
// continuation), not something a target-CTC structure can be solved for.
export interface CtcEsi {
    eligible: boolean;
    employerContribution: number;
    employeeContribution: number;
    // True only while coverage persists SPECIFICALLY because of contribution-period
    // continuation (gross has risen above the ESI ceiling mid-period) — not for an
    // employee who's just normally eligible under the ceiling.
    continuingAboveCeiling: boolean;
    // When the current Apr-Sep/Oct-Mar contribution period ends, set only when
    // continuingAboveCeiling is true — mirrors CtcLwf's nextFireMonth/nextFireYear shape.
    coverageUntilMonth: number | null;
    coverageUntilYear: number | null;
}

// View CTC only, like CtcEsi above — LWF fires only in the employee's work-state
// schedule's deduction month(s) (see services/lwfCalc.js), but this row is always shown
// with its configured amount + schedule chip, per the Dev Notes.
export interface CtcLwf {
    configured: boolean;
    fires: boolean | null;
    employeeAmount: number;
    employerAmount: number;
    schedule: string | null;
    scheduleLabel: string | null;
    // Resolved state actually driving the schedule (employee's own override, or the org
    // default when unset) — not necessarily the same as the employee's raw saved config.
    workState: string | null;
    workStateIsOrgDefault: boolean;
    nextFireMonth: number | null;
    nextFireYear: number | null;
}

export interface CtcBreakdown {
    annualCTC: number;
    monthlyCTC: number;
    basicSalary: number;
    grossSalary: number;
    earnings: CtcEarningComponent[];
    employerPf: CtcEmployerPf;
    // Only present on the forward (View CTC) breakdown — lets a caller (e.g. Revise
    // Salary's live preview) re-run calculateCtcBreakdown locally without a round trip.
    epfPolicy?: PfWagePolicy;
    // False when EPF is switched off for the establishment — no PF deduction, no employer
    // PF, and the PF rows are hidden. Absent means applicable (the default).
    epfApplicable?: boolean;
    // "Show PF Employee's Contribution in Earnings" in force for this breakdown — when
    // true, earnings already carry the display-only PF line.
    showPfInEarnings?: boolean;
    esi?: CtcEsi;
    lwf?: CtcLwf;
    costToCompany: number;
    deductions: CtcDeductionComponent[];
    totalDeductions: number;
    netTakeHome: number;
    warnings: string[];
    // True specifically when the configured earnings (Basic/HRA/fixed allowances/etc.) add
    // up to more than this CTC can actually cover — a hard infeasibility the backend's
    // reviseSalary() rejects outright, distinct from the OTHER warnings above (e.g. "Basic
    // below 50% of Gross"), which are compliance nudges the backend allows through. Callers
    // that submit this CTC (Add Employee, Revise Salary) should block submission on this
    // specifically, not on `warnings.length > 0` generally.
    isOverBudget: boolean;
}

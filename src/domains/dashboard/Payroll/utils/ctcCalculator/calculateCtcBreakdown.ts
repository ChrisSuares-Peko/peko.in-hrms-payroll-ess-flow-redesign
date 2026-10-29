import {
    calculateEmployerPfContribution,
    EPF_EMPLOYEE_RATE,
    resolvePfWage,
} from './calculateEmployerPf';
import { isBasicSalaryCompliant } from './isBasicSalaryCompliant';
import { applyPfEarningsLine, stripPfEarningsLine } from './pfEarningsLine';
import { CtcBreakdown, CtcDeductionComponent, CtcEarningComponent, PfWagePolicy } from './types';

// Mirrors the backend's ESI_WAGE_CEILING/ESI_EMPLOYER_RATE (models/use-cases/ctcCalculator.js)
// — the standard ceiling only; this client-side preview has no employee record yet to read
// isDifferentlyAbled from (which raises the backend's ceiling to ₹25,000), so a
// differently-abled new hire near that boundary may still see a brief mismatch resolved
// server-side on submit. Netting is otherwise unconditional on gross alone (no "continuing"
// concept needed here — see reviseSalary.js's identical simplification), matching exactly
// what the backend will do.
const ESI_WAGE_CEILING = 21000;
const ESI_EMPLOYER_RATE = 0.0325;

// Matches the same exact-name convention the rest of payroll already uses (see
// isProvidentFundDeduction in the backend's models/use-cases/salaryComponent.js) to decide
// which deduction is the statutory employee EPF line — the one that mirrors into Earnings
// and whose wage base follows the org's PF policy.
const isStatutoryPfDeduction = (deductionName?: string) => deductionName === 'Provident Fund (PF)';

interface EffectiveRule {
    calculationType?: string;
    calculationBasis?: string;
    calculationBasedOn?: string;
    calculationBasedOnName?: string | null;
    amountPercentage?: number;
}

// The rule to actually SOLVE a component with — the org's global-template rule
// (component.globalRule, attached by the backend's resolveEarnings when this component
// overrides one) when present, falling back to the component's own definition otherwise.
//
// This matters because every real hired employee has Basic (and other %-derived earnings
// like HRA) frozen as a concrete FIXED rupee override at hire time, by the CTC Calculator,
// rather than a live percentage — re-solving from that frozen snapshot would never let a
// Revise Salary preview move them at all. Re-solving from the org's CURRENT global rule
// instead makes a revision behave exactly like "the same engine that priced the hire
// rebuilds the structure": Basic re-derives as 50% of the NEW gross, HRA as 50% of the NEW
// Basic, etc. For a from-scratch solve (Add Employee/Dashboard Calculator), earnings never
// carry globalRule (there's no existing employee to derive one from), so this is a no-op
// there — a FIXED template value continues to mean fixed.
const effectiveRule = (component: CtcEarningComponent): EffectiveRule => {
    if (component.globalRule) return component.globalRule;

    // No global template link (standalone/custom component, or Add Employee/New Hire/
    // Dashboard Calculator hydrating raw org components with no employee override yet).
    // Mirrors the backend's identical default (mergeComponents.js's effectiveRule/
    // resolveLinear) — many real orgs' percentage earnings (HRA etc.) predate
    // calculationBasis/calculationBasedOn and carry no reference at all, which used to
    // silently resolve to ₹0 instead of the near-universal real convention "% of Basic".
    const basedOn = component.calculationBasedOn;
    let { calculationBasis } = component;
    if (component.calculationType === 'PERCENTAGE') {
        // CTC checked first — it carries no calculationBasedOn, which the legacy
        // no-reference branch below would otherwise misread as "% of Basic".
        if (calculationBasis === 'CTC') {
            calculationBasis = 'CTC';
        } else if (calculationBasis === 'GROSS_SALARY' || basedOn === 'GROSS_SALARY') {
            calculationBasis = 'GROSS_SALARY';
        } else if (calculationBasis === 'BASIC_SALARY' || !basedOn || basedOn === 'Basic Salary') {
            calculationBasis = 'BASIC_SALARY';
        }
    }

    return {
        calculationType: component.calculationType,
        calculationBasis,
        calculationBasedOn: basedOn,
        amountPercentage: component.amountPercentage,
    };
};

// A "% of CTC" Basic doesn't depend on Gross at all — it's fixed by the target CTC alone
// (mirrors the backend's reviseSalary.js solveBasicGivenGross).
const solveBasicGivenGross = (
    basicComponent: CtcEarningComponent,
    grossSalary: number,
    monthlyCTC: number
): number => {
    const rule = effectiveRule(basicComponent);
    if (rule.calculationType === 'FIXED') return rule.amountPercentage || 0;
    if (rule.calculationType === 'PERCENTAGE') {
        const base = rule.calculationBasis === 'CTC' ? monthlyCTC : grossSalary;
        return ((rule.amountPercentage || 0) / 100) * base;
    }
    return 0;
};

const resolveDeductionAmount = (
    deduction: CtcDeductionComponent,
    {
        basicSalary,
        grossSalary,
        policy,
    }: { basicSalary: number; grossSalary: number; policy: PfWagePolicy }
) => {
    if (isStatutoryPfDeduction(deduction.deductionName)) {
        return resolvePfWage(basicSalary, policy) * EPF_EMPLOYEE_RATE;
    }
    if (deduction.calculationType === 'FIXED') {
        return deduction.amountPercentage || 0;
    }
    if (deduction.calculationType === 'PERCENTAGE') {
        const base = deduction.salaryDeductionType === 'GROSS_SALARY' ? grossSalary : basicSalary;
        return ((deduction.amountPercentage || 0) / 100) * base;
    }
    return 0;
};

interface ResolvedEarning {
    component: CtcEarningComponent;
    calculatedAmount: number;
}

// Resolves every non-Basic, non-Balancing earning's amount for a given basic/gross
// guess — re-run each iteration since %-of-Basic/%-of-Gross earnings shift as the guess
// converges. Balancing is deliberately excluded here; its value is the remainder,
// computed once after convergence.
const resolveAllAmounts = (
    earnings: CtcEarningComponent[],
    basicComponent: CtcEarningComponent | undefined,
    basicSalary: number,
    grossSalary: number,
    monthlyCTC: number
): ResolvedEarning[] => {
    const amountCache = new Map<string, number>();
    if (basicComponent) amountCache.set(basicComponent.id, basicSalary);

    const resolveEarningAmount = (component?: CtcEarningComponent): number => {
        if (!component) return 0;
        if (amountCache.has(component.id)) return amountCache.get(component.id) as number;

        const rule = effectiveRule(component);
        let amount = 0;
        if (rule.calculationType === 'FIXED') {
            amount = rule.amountPercentage || 0;
        } else if (rule.calculationType === 'PERCENTAGE') {
            if (rule.calculationBasis === 'CTC') {
                amount = ((rule.amountPercentage || 0) / 100) * monthlyCTC;
            } else if (rule.calculationBasis === 'GROSS_SALARY') {
                amount = ((rule.amountPercentage || 0) / 100) * grossSalary;
            } else if (rule.calculationBasis === 'BASIC_SALARY') {
                amount = ((rule.amountPercentage || 0) / 100) * basicSalary;
            } else {
                // A global rule's calculationBasedOn is a GLOBAL-side id that doesn't
                // match the referenced component's employee-facing overridden id, so it's
                // resolved to a stable NAME (calculationBasedOnName) instead — look up by
                // name when present. A component's own (non-global) definition has no
                // name to go on, so it falls back to the original id-based lookup.
                const base = rule.calculationBasedOnName
                    ? earnings.find(o => o.componentName === rule.calculationBasedOnName)
                    : (earnings.find(o => o.id === rule.calculationBasedOn) ??
                      earnings.find(o => o.componentName === rule.calculationBasedOn));
                amount = ((rule.amountPercentage || 0) / 100) * resolveEarningAmount(base);
            }
        }
        amountCache.set(component.id, amount);
        return amount;
    };

    return earnings
        .filter(e => e.calculationType !== 'BALANCING')
        .map(component => ({
            component,
            calculatedAmount:
                component === basicComponent ? basicSalary : resolveEarningAmount(component),
        }));
};

interface SolvedEarnings {
    basicSalary: number;
    grossSalary: number;
    resolved: ResolvedEarning[];
    warning?: string;
}

// Solves Basic and Gross from a target CTC by fixed-point iteration:
// monthlyCTC = grossSalary + employerPf(basicSalary) + nonGrossTotal, where basicSalary
// and nonGrossTotal (the total of any earnings marked isPartOfGross: false — CTC
// benefits that sit outside Gross) both depend on grossSalary. With zero such benefits,
// nonGrossTotal is always 0 and this converges on the very first pass to exactly the old
// closed-form answer (verified numerically, see the backend's reviseSalary.js) — a
// superset of the old algorithm, not a behavior change for anyone with no benefits.
const solveEarningsForCtc = (
    earnings: CtcEarningComponent[],
    monthlyCTC: number,
    policy: PfWagePolicy,
    epfApplicable: boolean
): SolvedEarnings => {
    const basicComponent = earnings.find(e => e.componentName === 'Basic Salary');

    if (!basicComponent) {
        return {
            basicSalary: 0,
            grossSalary: monthlyCTC,
            resolved: [],
            warning:
                'No "Basic Salary" component is configured — configure one in Salary Components to compute CTC.',
        };
    }

    const basicRule = effectiveRule(basicComponent);
    let warning: string | undefined;
    if (basicRule.calculationType === 'PERCENTAGE' && !((basicRule.amountPercentage || 0) > 0)) {
        warning = 'Basic Salary percentage is not set.';
    } else if (
        basicRule.calculationType !== 'FIXED' &&
        basicRule.calculationType !== 'PERCENTAGE'
    ) {
        warning = 'Basic Salary must be configured as Fixed or a Percentage of Gross Salary/CTC.';
    }

    let grossSalary = monthlyCTC;
    let basicSalary = solveBasicGivenGross(basicComponent, grossSalary, monthlyCTC);
    let resolved: ResolvedEarning[] = [];

    for (let i = 0; i < 20; i += 1) {
        basicSalary = solveBasicGivenGross(basicComponent, grossSalary, monthlyCTC);
        // With EPF off for the establishment, employer PF isn't part of CTC at all.
        const employerPfTotal = epfApplicable
            ? calculateEmployerPfContribution(basicSalary, policy).total
            : 0;
        resolved = resolveAllAmounts(
            earnings,
            basicComponent,
            basicSalary,
            grossSalary,
            monthlyCTC
        );
        const nonGrossTotal = resolved
            .filter(r => r.component.isPartOfGross === false)
            .reduce((sum, r) => sum + r.calculatedAmount, 0);

        // Employer ESI counts toward CTC exactly like employer PF whenever gross is within
        // the ceiling — matching solveEarningsForCtc's identical rule (reviseSalary.js) —
        // or this preview understates what the backend will actually net out, letting a CTC
        // that looks feasible here (a small positive Balancing) turn out infeasible on
        // submit once the backend also subtracts ESI.
        const employerEsi =
            grossSalary > 0 && grossSalary <= ESI_WAGE_CEILING
                ? Math.ceil(grossSalary * ESI_EMPLOYER_RATE)
                : 0;
        const newGross = monthlyCTC - employerPfTotal - nonGrossTotal - employerEsi;
        const converged = Math.abs(newGross - grossSalary) < 0.01;
        grossSalary = newGross;
        if (converged) break;
    }

    // One final pass so `resolved`/`basicSalary` reflect the converged grossSalary exactly
    // (the loop's last resolveAllAmounts call used the pre-update guess).
    basicSalary = solveBasicGivenGross(basicComponent, grossSalary, monthlyCTC);
    resolved = resolveAllAmounts(earnings, basicComponent, basicSalary, grossSalary, monthlyCTC);

    return { basicSalary, grossSalary, resolved, warning };
};

interface CalculateCtcBreakdownArgs {
    annualCTC: number;
    epfPolicy: PfWagePolicy;
    // Compliance Settings > EPF > "EPF applies to this establishment". Off = no PF netted
    // out of CTC, no employer PF, and the statutory PF deduction dropped. Mirrors the
    // backend's solveEarningsForCtc(employerPfInCtc) / isEpfApplicableForPeriod.
    epfApplicable?: boolean;
    // Compliance Settings > EPF > "Show PF Employee's Contribution in Earnings" — adds the
    // display-only PF line to Earnings (taken out of Balancing); no figure changes.
    showPfInEarnings?: boolean;
    earnings: CtcEarningComponent[];
    deductions: CtcDeductionComponent[];
}

const ZERO_EMPLOYER_PF = {
    pfWage: 0,
    ceiling: 0,
    employeeEpf: 0,
    employerEps: 0,
    employerEpf: 0,
    edli: 0,
    adminCharges: 0,
    employerTotal: 0,
    totalDeposit: 0,
    adminEdli: 0,
    total: 0,
};

export const calculateCtcBreakdown = ({
    annualCTC,
    epfPolicy,
    epfApplicable = true,
    showPfInEarnings = false,
    earnings: earningsInput,
    deductions: allDeductions,
}: CalculateCtcBreakdownArgs): CtcBreakdown => {
    // Never solve from the display-only PF line (e.g. a Revise Salary preview seeded from a
    // breakdown that already shows it).
    const earnings = stripPfEarningsLine(earningsInput);
    const deductions = epfApplicable
        ? allDeductions
        : allDeductions.filter(d => !isStatutoryPfDeduction(d.deductionName));

    // Before a target CTC is entered, there's nothing to solve for — running the solve
    // anyway (e.g. against a FIXED-type Basic Salary that doesn't scale with CTC) produces
    // nonsensical negative "balancing"/Gross figures. Show plain zeros until a CTC is set.
    if (!annualCTC) {
        const zeroEarnings = earnings.map(e => ({ ...e, calculatedAmount: 0 }));
        const zeroDeductions = deductions.map(d => ({ ...d, calculatedAmount: 0 }));
        return {
            annualCTC: 0,
            monthlyCTC: 0,
            basicSalary: 0,
            grossSalary: 0,
            earnings: zeroEarnings,
            employerPf: ZERO_EMPLOYER_PF,
            epfApplicable,
            costToCompany: 0,
            deductions: zeroDeductions,
            totalDeductions: 0,
            netTakeHome: 0,
            warnings: [],
            isOverBudget: false,
        };
    }

    const monthlyCTC = (Number(annualCTC) || 0) / 12;
    const warnings: string[] = [];

    const {
        basicSalary,
        grossSalary,
        resolved,
        warning: basicWarning,
    } = solveEarningsForCtc(earnings, monthlyCTC, epfPolicy, epfApplicable);
    if (basicWarning) warnings.push(basicWarning);

    const employerPf = epfApplicable
        ? calculateEmployerPfContribution(basicSalary, epfPolicy)
        : ZERO_EMPLOYER_PF;

    const resolvedDeductions = deductions.map(deduction => ({
        ...deduction,
        calculatedAmount: resolveDeductionAmount(deduction, {
            basicSalary,
            grossSalary,
            policy: epfPolicy,
        }),
    }));
    const totalDeductions = resolvedDeductions.reduce((sum, d) => sum + d.calculatedAmount, 0);

    const resolvedNonBalancing = resolved.map(r => ({
        ...r.component,
        calculatedAmount: r.calculatedAmount,
    }));
    // Balancing absorbs whatever's left of GROSS specifically — non-gross benefits are
    // excluded here so they don't eat into this remainder (they're netted out of Gross
    // itself, up in solveEarningsForCtc, and added back into costToCompany below).
    const sumOfPartOfGross = resolved
        .filter(r => r.component.isPartOfGross !== false)
        .reduce((sum, r) => sum + r.calculatedAmount, 0);
    const nonGrossTotal = resolved
        .filter(r => r.component.isPartOfGross === false)
        .reduce((sum, r) => sum + r.calculatedAmount, 0);

    const balancingComponents = earnings.filter(e => e.calculationType === 'BALANCING');

    let finalEarnings = resolvedNonBalancing;
    // Specifically "this CTC value is too low for an otherwise-valid structure" — distinct
    // from the OTHER warnings pushed below (missing Basic/Balancing config, below-50%-Basic
    // compliance nudge), which raising the CTC wouldn't fix and which the backend doesn't
    // hard-block on. Only this one means "reduce an amount or raise the CTC" is the actual
    // fix, so it's the one callers should block submission on.
    let isOverBudget = false;
    if (balancingComponents.length >= 1) {
        const remainder = grossSalary - sumOfPartOfGross;
        // The Balancing component must never display a negative amount — components adding
        // up to more than Gross means the structure itself doesn't fit this CTC, which the
        // Add/Edit Component modal is responsible for rejecting before it ever gets here;
        // this floor is the last-resort display guard if that's somehow bypassed.
        const displayRemainder = Math.max(0, remainder);
        finalEarnings = [
            ...resolvedNonBalancing,
            ...balancingComponents.map((b, index) => ({
                ...b,
                calculatedAmount: index === 0 ? displayRemainder : 0,
            })),
        ];
        if (balancingComponents.length > 1) {
            warnings.push(
                'More than one Balancing component is configured — only the first absorbs the remainder.'
            );
        }
        if (remainder < 0) {
            isOverBudget = true;
            warnings.push(
                'These components add up to more than this CTC allows. Reduce an amount, or increase the CTC.'
            );
        }
    } else {
        warnings.push(
            'No Balancing component is configured — Earnings may not reconcile exactly to Gross Income.'
        );
    }

    // Benefits marked "not part of Gross" still cost the company — add their total back
    // in here even though they were excluded from grossSalary above.
    const costToCompany = grossSalary + employerPf.total + nonGrossTotal;
    const netTakeHome = grossSalary - totalDeductions;

    // Checked against Basic's own EFFECTIVE rule first (see isBasicSalaryCompliant's doc
    // comment) — a "50% of Gross" rule can never be non-compliant, whatever the resolved
    // rupee amounts round to.
    const basicComponentForCompliance = earnings.find(e => e.componentName === 'Basic Salary');
    const basicRuleForCompliance = basicComponentForCompliance
        ? effectiveRule(basicComponentForCompliance)
        : undefined;
    // "X% of CTC" vouches for compliance just like "X% of Gross": Gross never exceeds CTC,
    // so Basic >= 50% of CTC already means Basic >= 50% of Gross.
    const basicPercentOfGrossRule =
        basicRuleForCompliance?.calculationType === 'PERCENTAGE' &&
        (basicRuleForCompliance.calculationBasis === 'GROSS_SALARY' ||
            basicRuleForCompliance.calculationBasis === 'CTC')
            ? basicRuleForCompliance.amountPercentage
            : undefined;

    if (!isBasicSalaryCompliant(basicSalary, grossSalary, basicPercentOfGrossRule)) {
        warnings.push(
            'The Basic Salary is below 50% of Gross. You may not be compliant as per the labor codes. Please double check before proceeding.'
        );
    }

    const showPfLine = epfApplicable && showPfInEarnings;
    const employeePfAmount =
        resolvedDeductions.find(d => isStatutoryPfDeduction(d.deductionName))?.calculatedAmount ||
        0;

    return {
        annualCTC: Number(annualCTC) || 0,
        monthlyCTC,
        basicSalary,
        grossSalary,
        earnings: showPfLine ? applyPfEarningsLine(finalEarnings, employeePfAmount) : finalEarnings,
        employerPf,
        epfApplicable,
        showPfInEarnings: showPfLine,
        costToCompany,
        deductions: resolvedDeductions,
        totalDeductions,
        netTakeHome,
        warnings,
        isOverBudget,
    };
};

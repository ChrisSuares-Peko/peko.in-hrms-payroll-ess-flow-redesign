const SalaryComponent = require('../entities/salaryComponent');
const DeductionComponent = require('../entities/deductionComponent');
const ComplianceSettings = require('../entities/complianceSettings');
const Employee = require('../entities/employee');
const Salary = require('../entities/salary');
const SalaryStructureVersion = require('../entities/salaryStructureVersion');
const { calculateSingleDeductionAmount, isProvidentFundDeduction } = require('./salaryComponent');
const {
  mergeGlobalAndEmployeeComponents,
  resolveEarnings,
  effectiveRule,
  isBasicSalaryCompliant,
  basicPercentRuleForCompliance,
} = require('./mergeComponents');
const {
  calculateEmployerPfContribution,
  resolveEpfPolicyFromComplianceSettings,
  isEpfApplicableForPeriod,
  isPfInEarningsForPeriod,
} = require('../../services/calculateEmployerPf');
const { applyPfEarningsLine } = require('../../services/pfEarningsLine');
const { lwfFor } = require('../../services/lwfCalc');
const { ensureProvidentFundDeductionExists } = require('./complianceSettings');
const { markSalaryStale } = require('../../services/salaryStaleMarker');

const ESI_WAGE_CEILING = 21000;
const ESI_WAGE_CEILING_DIFFERENTLY_ABLED = 25000;
const ESI_EMPLOYER_RATE = 0.0325;
const ESI_EMPLOYEE_RATE = 0.0075;
const PAID_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];

const resolveDeductions = (components, { basicSalary, grossSalary, pfPolicy, month, year }) => {
  const deductions = components.map((component) => {
    const calculatedAmount = calculateSingleDeductionAmount({
      calculationType: component.calculationType,
      amountPercentage: component.amountPercentage,
      calculationBasis: component.calculationBasis,
      salaryDeductionType: component.salaryDeductionType,
      deductionName: component.deductionName,
      basicSalary,
      grossSalaryBase: grossSalary,
      pfPolicy,
      month,
      year,
      globalComponentId: component.globalComponentId,
    });
    return {
      id: component._id.toString(),
      deductionName: component.deductionName,
      calculationType: component.calculationType,
      salaryDeductionType: component.salaryDeductionType,
      amountPercentage: component.amountPercentage,
      calculatedAmount,
      isEmployeeSpecific: !!component.employee,
    };
  });

  const totalDeductions = deductions.reduce((sum, d) => sum + d.calculatedAmount, 0);
  return { deductions, totalDeductions };
};

// Apr 1–Sep 30, or Oct 1–Mar 31, whichever contains `date`.
const getContributionPeriodBounds = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  if (month >= 3 && month <= 8) {
    return { start: new Date(year, 3, 1), end: new Date(year, 8, 30, 23, 59, 59, 999) };
  }
  if (month >= 9) {
    return { start: new Date(year, 9, 1), end: new Date(year + 1, 2, 31, 23, 59, 59, 999) };
  }
  return { start: new Date(year - 1, 9, 1), end: new Date(year, 2, 31, 23, 59, 59, 999) };
};

// ESI eligibility is automatic by gross ceiling — the toggle is an OPT-OUT override, not
// the gate itself: leaving it untouched (undefined) or explicitly ON means the ceiling
// rule alone decides eligibility; explicitly switching it OFF force-disables ESI for this
// employee regardless of gross (e.g. an employee the org has separately confirmed is
// covered elsewhere). This is the opposite default from an earlier version of this
// function, which required an explicit `true` to be eligible at all (an opt-IN) — that
// design defaulted every employee who'd never touched the toggle to ineligible regardless
// of gross, which was a real bug, not a feature. Defaulting to "ceiling decides" and only
// treating an explicit `false` as an override avoids reintroducing that.
// Contribution-period continuation: once covered, a mid-period raise above the ceiling
// doesn't drop coverage until the period ends. No dedicated ESI processing job exists to
// track "when did coverage start" on a schedule, so the coverage marker is lazily
// self-maintained on each read instead.
// `persist` defaults to true for the normal "this read IS the authoritative moment to
// (lazily) record coverage state" case. Pass `persist: false` when the caller only wants
// an ESI eligibility/amount READ without ALSO stamping esiCoverageSince right now — e.g.
// reviseSalary.js's post-solve call exists purely to build an informational note string;
// letting it write "coverage starts now" would make the very NEXT read (moments later,
// often within the same request or the immediately following one) misinterpret a
// brand-new hire's first-ever eligibility as "was already covered before this
// calculation", switching employer ESI from netted-into-CTC to piled-on-top.
// eligibilityGross: the full monthly gross that decides coverage when grossSalary (the
// contribution base) is only what was paid in a part month / LOP month. Defaults to it.
const resolveEsi = async ({ employee, grossSalary, eligibilityGross = grossSalary, persist = true }) => {
  const notCovered = {
    eligible: false,
    employerContribution: 0,
    employeeContribution: 0,
    continuingAboveCeiling: false,
    coverageUntilMonth: null,
    coverageUntilYear: null,
  };
  if (!employee) return notCovered;
  if (employee.otherConfigurations?.enableESI === false) return notCovered;

  const now = new Date();
  const { start, end } = getContributionPeriodBounds(now);
  const ceiling = employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING;
  const nowlyEligible = eligibilityGross > 0 && eligibilityGross <= ceiling;
  // An employee created without ever touching Statutory Components can have no
  // otherConfigurations sub-object at all (not just a missing esiCoverageSince) —
  // optional-chain the read, and materialize it before writing below.
  const coverageSince = employee.otherConfigurations?.esiCoverageSince
    ? new Date(employee.otherConfigurations.esiCoverageSince)
    : null;
  const continuingCoverage = !!coverageSince && coverageSince >= start && coverageSince <= end;
  const eligible = nowlyEligible || continuingCoverage;

  if (persist && nowlyEligible && !continuingCoverage) {
    employee.otherConfigurations = employee.otherConfigurations || {};
    employee.otherConfigurations.esiCoverageSince = now;
    await employee.save();
  } else if (persist && !eligible && coverageSince) {
    employee.otherConfigurations = employee.otherConfigurations || {};
    employee.otherConfigurations.esiCoverageSince = null;
    await employee.save();
  }

  if (!eligible) return notCovered;
  // Above-ceiling continuation is only meaningful to call out while it's actually the
  // reason coverage persists — an employee comfortably under the ceiling is just normally
  // eligible, not "continuing" anything worth a locked-until label.
  const continuingAboveCeiling = continuingCoverage && eligibilityGross > ceiling;
  return {
    eligible: true,
    employerContribution: Math.ceil(grossSalary * ESI_EMPLOYER_RATE),
    employeeContribution: Math.ceil(grossSalary * ESI_EMPLOYEE_RATE),
    continuingAboveCeiling,
    coverageUntilMonth: continuingAboveCeiling ? end.getMonth() + 1 : null,
    coverageUntilYear: continuingAboveCeiling ? end.getFullYear() : null,
  };
};

// skipBackfill: true for callers that only need the computed numbers, not the persisted
// side effect — e.g. reviseSalary()'s own internal call to capture "the CTC as it stood
// immediately before this revision" for the history record. Without this, that read could
// backfill a brand-new SalaryStructureVersion for this employee just before reviseSalary()
// creates its OWN new version moments later — both truncated to the same effectiveFrom (the
// 1st of the current month), landing two versions on an identical timestamp that the
// currentVersion lookup elsewhere has no fully reliable way to break the tie on, letting a
// stale/reconstructed CTC occasionally win over the real one just committed.
// includePfEarningsLine: opt-in, DISPLAY callers only (CTC/Salary Structure tab, Salary
// Profile, payslip PDF) — adds the "PF Employee's Contribution" Earnings line when that
// switch is on for the period (services/pfEarningsLine.js). Every caller that solves from
// or persists these earnings (payroll processing, Balancing re-fit, Revise Salary) must
// leave it off, or the line would be counted as a real component.
exports.getEmployeeCtcBreakdown = async ({
  corporateUserID,
  employeeId,
  skipBackfill = false,
  month = null,
  year = null,
  includePfEarningsLine = false,
}) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  // The payroll period this breakdown is FOR — a specific historical/future month when the
  // caller passes one (e.g. viewing a past Salary Profile), otherwise "right now" (the CTC
  // Calculator / Salary Structure tab's live-preview default). Drives which PF wage ceiling
  // applies; deliberately NOT used for the "is THIS calendar month already paid" check or
  // the LWF schedule below, both of which are genuinely about today's actual date.
  const pfMonth = month || currentMonth;
  const pfYear = year || currentYear;

  // Guarantees PF is deducted even for an org that's never explicitly saved Compliance
  // Settings > EPF — see ensureProvidentFundDeductionExists's comment.
  await ensureProvidentFundDeductionExists(corporateUserID);

  // eslint-disable-next-line prefer-const
  let [salaryComponents, deductionComponents, complianceSettings, employee, globalEarningTemplates, currentMonthPaid, currentVersion] = await Promise.all([
    mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
    mergeGlobalAndEmployeeComponents(DeductionComponent, { corporateUserID, employeeId }),
    ComplianceSettings.findOne({ corporateUser: corporateUserID }),
    Employee.findById(employeeId),
    // Needed so resolveEarnings can attach each override's ORIGINAL org-level rule
    // (globalRule) — the source of truth Revise Salary re-solves from, rather than
    // whatever rupee amount got frozen into the employee's override at hire time.
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
    // Once this month has actually been paid, the live structure becomes historical — a
    // global config change (e.g. a component's role switching to/from Balancing) stops
    // silently reflecting here and needs an explicit Revise Salary, same as any other
    // structural change to an already-paid month.
    Salary.exists({
      corporateUser: corporateUserID,
      employee: employeeId,
      year: currentYear,
      month: currentMonth,
      paymentStatus: { $in: PAID_STATUSES },
    }),
    // The employee's currently-committed CTC (see the re-solve anchor below) — same
    // "latest version effective on/before the target date" lookup salaryComponent.js's
    // payslip-resolution path already uses, just targeting "now" instead of a specific
    // payroll month. createdAt tiebreaker matches undoLatestRevision's identical query —
    // two versions can share the same effectiveFrom (both truncated to the 1st of the same
    // month), and without a tiebreaker the "current" one is picked arbitrarily; the most
    // recently CREATED one is the one that's actually meant to be authoritative.
    SalaryStructureVersion.findOne({ employee: employeeId, effectiveFrom: { $lte: now } })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean(),
  ]);
  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));

  // Establishment-level EPF switch — the month's own setting when a specific payroll month
  // is asked for, otherwise the current setting (live Salary Structure view). With EPF off
  // the PF deduction is dropped here, and employer PF (derived from it below) follows.
  // Only the resolved list is filtered; the employee's own PF row and toggle are untouched,
  // so individual exemptions come back intact when EPF is switched on again.
  const epfApplicable = isEpfApplicableForPeriod(complianceSettings, month, year);
  if (!epfApplicable) {
    deductionComponents = deductionComponents.filter((c) => !isProvidentFundDeduction(c.deductionName));
  }
  // The agreed CTC stays fixed across an EPF switch flip; what moves is its split. With EPF
  // off for this period, employer PF is no longer part of that CTC, so the re-solve below
  // spreads it across the earnings by their own rules (Basic %-of-Gross, HRA %-of-Basic,
  // Balancing takes the rest) — and back again when EPF is switched on. Paid months are
  // never re-solved (see currentMonthPaid), so issued salaries don't change.
  // (Assigned below, once the employee's own PF status is known.)

  let { earnings, basicSalary, grossSalary, nonGrossTotal } = resolveEarnings(salaryComponents, globalComponentsById, {
    monthlyCtc: currentVersion?.annualCTC > 0 ? currentVersion.annualCTC / 12 : undefined,
  });

  const pfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
  let { deductions, totalDeductions: deductionsSubtotal } = resolveDeductions(deductionComponents, {
    basicSalary,
    grossSalary,
    pfPolicy,
    month: pfMonth,
    year: pfYear,
  });

  // Employer PF only applies if the employee actually has an active PF deduction — this
  // is what the EPF-enabled toggle now actually controls (toggling it off flips this
  // component to INACTIVE, excluding it above), rather than trusting
  // otherConfigurations.enableEPF directly: the deduction's own status is the reliable
  // signal here, since the toggle and the deduction row can otherwise drift out of sync
  // (e.g. an employee whose PF deduction was created active by default at onboarding but
  // whose enableEPF flag was never explicitly touched).
  let isEpfActive = deductions.some((d) => isProvidentFundDeduction(d.deductionName));
  // Employer PF is part of the agreed CTC only while EPF applies to the establishment AND
  // to this employee (their own EPF toggle) — with either off, the re-solve below spreads
  // the whole CTC across the earnings instead of netting employer PF out of it. (When the
  // establishment switch is off the PF deduction was already filtered out above, so
  // isEpfActive alone covers both; epfApplicable is kept explicit for clarity.)
  const employerPfInCtc = epfApplicable && isEpfActive;
  let employerPf = isEpfActive
    ? calculateEmployerPfContribution(basicSalary, pfPolicy, pfMonth, pfYear)
    : { pfWage: 0, ceiling: 0, employeeEpf: 0, employerEps: 0, employerEpf: 0, edli: 0, adminCharges: 0, employerTotal: 0, totalDeposit: 0, total: 0 };

  // Captured BEFORE resolveEsi's call below can mutate esiCoverageSince — a brand-new hire
  // (or anyone else first crossing under the ESI ceiling) has that call stamp "coverage
  // starts now" as a side effect, and re-deriving "continuing" from the employee AFTER
  // that write would misread this exact moment's own first-time eligibility as coverage
  // that already existed before the re-solve below, wrongly piling employer ESI on top of
  // CTC instead of netting it in (see reviseSalary.js's identical persist:false fix).
  const { start: esiPeriodStart, end: esiPeriodEnd } = getContributionPeriodBounds(now);
  const coverageSinceBeforeResolve = employee?.otherConfigurations?.esiCoverageSince
    ? new Date(employee.otherConfigurations.esiCoverageSince)
    : null;
  const wasAlreadyContinuingEsi =
    !!coverageSinceBeforeResolve && coverageSinceBeforeResolve >= esiPeriodStart && coverageSinceBeforeResolve <= esiPeriodEnd;

  let esi = await resolveEsi({ employee, grossSalary });

  if (!currentMonthPaid) {
    // Re-solve against the SAME total CTC the employee already has — same engine Revise
    // Salary itself uses (solveEarningsForCtc), just targeting the current CTC instead of a
    // newly-entered one — purely to pick up any component definition changed at the global
    // level since this employee's last revision (e.g. Special Allowance switching from
    // Balancing to Fixed, with a new component taking over as the Balancing absorber).
    // Nothing about the employee's total package moves this way, only the allocation
    // between components whose effective role/rule changed. Requires a lazy require —
    // reviseSalary.js imports getEmployeeCtcBreakdown from this file at load time, so a
    // top-level require here would create a circular import.
    // eslint-disable-next-line global-require
    const { solveEarningsForCtc } = require('./reviseSalary');
    // Anchor on the employee's actually-COMMITTED CTC (currentVersion.annualCTC / 12) when
    // one exists, rather than reconstructing an approximation from currently-resolved
    // earnings. The reconstruction below (grossSalary + employerPf + esi + nonGross, all
    // derived from whatever Basic/HRA/Balancing currently resolve to) is inherently lossy
    // whenever any earning is percentage-of-Gross/Basic with no FIXED anchor of its own —
    // Balancing's own necessary 2-decimal rounding gets amplified by 1/(1 - sumCoefficients)
    // each time this runs, and since a fresh Balancing gets persisted from THAT
    // slightly-eroded result on every view, the drift compounds further on the next view.
    //
    // A pre-fix employee (hired before this lookup existed, never revised since) has no
    // version at all — a backfilled one gets created below (after the re-solve, so it can
    // snapshot the freshly-solved earnings), ROUNDED to the nearest rupee to correct the
    // drift rather than freeze it in permanently. For THIS request, though, the rounded
    // reconstruction is used as the anchor directly rather than waiting on that write.
    // Deliberately NOT reusing reviseSalary() for the backfill itself — it also checks for
    // already-PAID historical salary months and generates arrears for any mismatch against
    // them, which a background backfill must never trigger; a plain SalaryStructureVersion
    // insert (below) has no such side effect.
    const reconstructedMonthlyCtc = grossSalary + employerPf.total + esi.employerContribution + nonGrossTotal;
    // Derived from annualCTC, not the stored monthlyCTC field directly — monthlyCTC is
    // persisted rounded to a whole rupee (reviseSalary.js), so anchoring on it directly
    // would re-introduce a ~₹4/year loss (₹1,83,333 × 12 = ₹21,99,996, not ₹22,00,000).
    // annualCTC is rounded at the ANNUAL level instead, so dividing back by 12 stays within
    // a fraction of a paisa of the true committed monthly figure.
    // A stored annualCTC of 0 (or less) is never a legitimate committed figure — treat it
    // the same as "no version at all" and reconstruct fresh from live components instead
    // of trusting it. This is what lets an employee whose version was corrupted by a
    // now-fixed bug elsewhere (e.g. mergeGlobalAndEmployeeComponents silently dropping an
    // active override tied to a since-deactivated global template, which zeroed this same
    // reconstruction the first time it ran) self-heal on their next view, with no manual
    // database cleanup required.
    const hasValidCommittedCtc = currentVersion && currentVersion.annualCTC > 0;
    const anchorAnnualCtc = hasValidCommittedCtc ? currentVersion.annualCTC : Math.round(reconstructedMonthlyCtc * 12);
    const anchorMonthlyCtc = anchorAnnualCtc / 12;
    const esiContext = {
      continuing: wasAlreadyContinuingEsi,
      ceiling: employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING,
      disabled: employee?.otherConfigurations?.enableESI === false,
    };
    // isEpfActive depends only on whether the PF deduction row is ACTIVE, not on any amount,
    // so it's already final here — without it the solve nets employer PF out of Gross even
    // for an EPF-disabled employee, under-shooting the agreed CTC by that amount. It also
    // already reflects the establishment EPF switch (employerPfInCtc): with EPF off for the
    // period the PF deduction was filtered out above, so isEpfActive is false too.
    const solved = solveEarningsForCtc(salaryComponents, anchorMonthlyCtc, pfPolicy, globalComponentsById, esiContext, pfMonth, pfYear, {
      epfActive: isEpfActive,
    });

    if (!solved.warning && solved.basicComponent) {
      const componentIdByName = new Map(salaryComponents.map((c) => [c.componentName, c._id.toString()]));
      // solveEarningsForCtc always reports Basic's amountPercentage as its resolved RUPEE
      // value, not its raw percent — correct for an actual Revise Salary (which freezes
      // Basic to FIXED right after), wrong here since this is a display-only preview that
      // never persists: a live PERCENTAGE-type Basic (e.g. "50% of Gross") would otherwise
      // show its tag as "53191% of Gross" instead of "50% of Gross". Re-read the raw
      // percent from the effective rule for display, same fix bulkEmployeeCtc.js already
      // applies for the same reason.
      const basicRule = effectiveRule(solved.basicComponent, globalComponentsById);
      earnings = solved.earnings.map((e) => {
        const withId = { id: componentIdByName.get(e.componentName) || e.componentName, ...e };
        if (e.componentName === 'Basic Salary' && basicRule.calculationType === 'PERCENTAGE') {
          withId.amountPercentage = basicRule.amountPercentage || 0;
          // Type/basis must come from the same rule as the percent — the employee's own
          // stored row can still carry an older basis (e.g. GROSS_SALARY persisted before
          // the org switched Basic to "% of CTC"), which would tag a CTC-derived amount
          // as "50% of Gross".
          withId.calculationType = basicRule.calculationType;
          withId.calculationBasis = basicRule.calculationBasis;
        }
        return withId;
      });
      basicSalary = solved.basicSalary;
      grossSalary = solved.grossSalary;
      nonGrossTotal = earnings.filter((e) => e.isPartOfGross === false).reduce((sum, e) => sum + e.calculatedAmount, 0);

      ({ deductions, totalDeductions: deductionsSubtotal } = resolveDeductions(deductionComponents, {
        basicSalary,
        grossSalary,
        pfPolicy,
        month: pfMonth,
        year: pfYear,
      }));
      isEpfActive = deductions.some((d) => isProvidentFundDeduction(d.deductionName));
      employerPf = isEpfActive
        ? calculateEmployerPfContribution(basicSalary, pfPolicy, pfMonth, pfYear)
        : { pfWage: 0, ceiling: 0, employeeEpf: 0, employerEps: 0, employerEpf: 0, edli: 0, adminCharges: 0, employerTotal: 0, totalDeposit: 0, total: 0 };
      esi = await resolveEsi({ employee, grossSalary });

      // Backfill this pre-fix employee's missing initial version now that the earnings for
      // anchorAnnualCtc have actually been solved — a plain insert, not reviseSalary(), so
      // it can never touch already-PAID months or generate arrears (see the comment above
      // anchorAnnualCtc). Effective from their join month so past-month payslip resolution
      // (salaryComponent.js's own "latest version effective on/before target month" lookup)
      // picks this up too, not just future views. Skipped when solveEarningsForCtc itself
      // warned (e.g. no Basic Salary configured) — nothing valid to snapshot yet — and
      // skipped when the anchor CTC can't actually cover the org's configured
      // fixed/percentage earnings (specialAllowanceAmount < 0, the same feasibility check
      // reviseSalary() itself throws on) — persisting a version here would otherwise
      // silently commit exactly the CTC-too-low state reviseSalary was designed to reject,
      // permanently baking in an anchor nobody actually confirmed rather than leaving this
      // a transient, re-computed-on-every-view display (still surfaced via the "components
      // add up to more than this CTC allows" warning below).
      // Also re-backfills (rather than skipping) when the existing version is the
      // corrupted-CTC case above — this persists a fresh, correct version with a newer
      // createdAt, which the tiebreaker sort on the "current version" lookup everywhere
      // else (this function, getEmployeeSalaryComponentForProcessSalary, etc.) always
      // picks over an older one sharing the same effectiveFrom. The stale ₹0 document is
      // left in place but never read again — no manual database cleanup required.
      if (!skipBackfill && !hasValidCommittedCtc && !solved.warning && !(solved.specialAllowanceAmount < 0)) {
        const joinDate = employee?.employeeInformation?.dateOfJoin
          ? new Date(employee.employeeInformation.dateOfJoin)
          : null;
        // A missing/invalid join date must NEVER fall back to "now" — that stamps this
        // backfill as effective THIS month, which then outranks (per the "greatest
        // effectiveFrom <= target" current-version lookup used everywhere) any genuine
        // revision an admin later backdates to an earlier month, silently shadowing it
        // forever even though Revision History still shows it correctly. Falling back to
        // a far-past sentinel instead means a real join date is always preferred when
        // known, and this backfill can never outrank an actual revision.
        const effective = joinDate && !Number.isNaN(joinDate.getTime()) ? joinDate : new Date(1970, 0, 1);
        currentVersion = await SalaryStructureVersion.create({
          corporateUser: corporateUserID,
          employee: employeeId,
          effectiveFrom: new Date(effective.getFullYear(), effective.getMonth(), 1),
          annualCTC: anchorAnnualCtc,
          monthlyCTC: Math.round(anchorAnnualCtc / 12),
          employerPfInCtc,
          previousAnnualCTC: null,
          earnings,
          previousEarnings: [],
          reason: 'Initial hire',
          createdBy: null,
        });
        // A committed CTC now exists, which changes how payroll resolves this employee's
        // earnings (getEmployeeSalaryComponentForProcessSalary).
        await markSalaryStale({
          corporateUserID,
          employeeIds: [employeeId],
          reason: 'SalaryStructureVersion backfill',
        });
      }
    }
  }

  // LWF's employee share only actually reduces take-home in a month it fires — this
  // breakdown reflects "as of the current month" for that figure, while the `lwf` field
  // below carries the full configured amounts + schedule so the UI can always show the
  // row (per the "always-visible row" requirement) regardless of whether it fires now.
  const lwf = lwfFor({ employee, month: currentMonth, year: currentYear, complianceSettings, grossSalary });

  const totalDeductions = deductionsSubtotal + esi.employeeContribution + (lwf.fires ? lwf.employeeAmount : 0);
  // Benefits marked "not part of Gross" still cost the company — add their total back in
  // here even though resolveEarnings excluded them from grossSalary above. LWF's employer
  // share is deliberately NOT added here — per the Dev Notes it's paid on top of CTC,
  // never inside it.
  const costToCompany = grossSalary + employerPf.total + esi.employerContribution + nonGrossTotal;
  const netTakeHome = grossSalary - totalDeductions;

  // Read independently of whichever branch above produced basicSalary/grossSalary
  // (re-solved this-month preview vs. the already-paid/persisted path) — salaryComponents
  // and globalComponentsById are the raw, unbranched inputs, so this rule lookup is always
  // accurate regardless of which one ran. See isBasicSalaryCompliant's doc comment for why
  // the rule is checked ahead of the resolved rupee amounts.
  const basicComponentForCompliance = salaryComponents.find((c) => c.componentName === 'Basic Salary');
  const basicRuleForCompliance = basicComponentForCompliance
    ? effectiveRule(basicComponentForCompliance, globalComponentsById)
    : null;
  const basicPercentOfGrossRule = basicPercentRuleForCompliance(basicRuleForCompliance);

  const warnings = [];
  if (!isBasicSalaryCompliant(basicSalary, grossSalary, basicPercentOfGrossRule)) {
    warnings.push('The Basic Salary is below 50% of Gross. You may not be compliant as per the labor codes. Please double check before proceeding.');
  }
  // The Balancing component is floored at 0 for display (see resolveEarnings/
  // solveEarningsForCtc) rather than ever going negative — when the other earnings alone
  // already exceed Gross, that floor means they no longer sum back to Gross exactly, which
  // would otherwise look like an unexplained mismatch with no indication why.
  const sumOfGrossEarnings = earnings
    .filter((e) => e.isPartOfGross !== false)
    .reduce((sum, e) => sum + e.calculatedAmount, 0);
  if (sumOfGrossEarnings > grossSalary + 0.5) {
    warnings.push('These components add up to more than this CTC allows. Reduce an amount, or increase the CTC.');
  }

  const showPfInEarnings = isPfInEarningsForPeriod(complianceSettings, month, year);
  const employeePfAmount = deductions.find((d) => isProvidentFundDeduction(d.deductionName))?.calculatedAmount || 0;

  return {
    basicSalary,
    grossSalary,
    earnings: includePfEarningsLine && showPfInEarnings ? applyPfEarningsLine(earnings, employeePfAmount) : earnings,
    showPfInEarnings,
    employerPf,
    // Exposed so the frontend can re-run this same solve locally (e.g. Revise Salary's
    // live structure preview) without a round trip for every keystroke.
    epfPolicy: pfPolicy,
    esi,
    lwf,
    costToCompany,
    // The headline "Annual CTC" is what was AGREED with the employee (see the frontend's
    // own "How This Works" copy: "The CTC is fixed... it's what was agreed") — not
    // necessarily the same as costToCompany*12, which can legitimately run higher when an
    // "on top of CTC" extra applies (e.g. a mid-period raise pushing gross above the ESI
    // ceiling — see esiNote in reviseSalary.js, and LWF's employer share above, which this
    // same costToCompany already correctly keeps separate). When a real committed version
    // exists, its own annualCTC is the actual agreed figure and must be reported verbatim,
    // not silently replaced by a recomputed total that includes those on-top extras.
    // Falls back to the derived total only when there's no committed version to anchor on
    // (the legacy-employee reconstruction path above) — or, same as anchorAnnualCtc above,
    // when the version that IS on record is the corrupted-CTC case (e.g. skipBackfill:true
    // callers never get the self-heal write, so a stale ₹0 document here would otherwise
    // still be reported verbatim as "the agreed CTC").
    annualCtc: (currentVersion && currentVersion.annualCTC > 0) ? currentVersion.annualCTC : costToCompany * 12,
    epfApplicable,
    employerPfInCtc,
    deductions,
    totalDeductions,
    netTakeHome,
    warnings,
  };
};

exports.ESI_WAGE_CEILING = ESI_WAGE_CEILING;
exports.ESI_WAGE_CEILING_DIFFERENTLY_ABLED = ESI_WAGE_CEILING_DIFFERENTLY_ABLED;
exports.ESI_EMPLOYER_RATE = ESI_EMPLOYER_RATE;
exports.getContributionPeriodBounds = getContributionPeriodBounds;
exports.resolveEsi = resolveEsi;

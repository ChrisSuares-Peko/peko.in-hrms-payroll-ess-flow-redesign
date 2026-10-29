const SalaryComponent = require('../entities/salaryComponent');
const DeductionComponent = require('../entities/deductionComponent');
const ComplianceSettings = require('../entities/complianceSettings');
const SalaryStructureVersion = require('../entities/salaryStructureVersion');
const Arrears = require('../entities/arrears');
const Salary = require('../entities/salary');
const Employee = require('../entities/employee');
const {
  mergeGlobalAndEmployeeComponents,
  resolveEarnings,
  effectiveRule,
  findGlobalTemplate,
  isBalancingComponent,
  isBasicSalaryCompliant,
  basicPercentRuleForCompliance,
} = require('./mergeComponents');
const { resolvePfMonthlyCap, capPfAmount } = require('../../services/calculateEmployerPf');
const {
  getEmployeeCtcBreakdown,
  resolveEsi,
  getContributionPeriodBounds,
  ESI_WAGE_CEILING,
  ESI_WAGE_CEILING_DIFFERENTLY_ABLED,
  ESI_EMPLOYER_RATE,
} = require('./ctcCalculator');
const {
  calculateEmployerPfContribution,
  resolveEpfPolicyFromComplianceSettings,
  isEpfApplicableForPeriod,
} = require('../../services/calculateEmployerPf');
const { ensureEpfEnabledWhenMandatory } = require('./complianceSettings');
const { isProvidentFundDeduction } = require('./salaryComponent');
const moment = require('moment');

const PAID_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];

// Same signal ctcCalculator.js uses: EPF is active only while the employee's PF deduction
// is ACTIVE (the EPF toggle flips it INACTIVE, which mergeGlobalAndEmployeeComponents drops).
const isEpfActiveForEmployee = async (corporateUserID, employeeId) => {
  const deductionComponents = await mergeGlobalAndEmployeeComponents(DeductionComponent, { corporateUserID, employeeId });
  return deductionComponents.some((d) => isProvidentFundDeduction(d.deductionName));
};

// Pure, non-mutating mirror of resolveEsi's continuation check — whether the employee was
// ALREADY covered before this revision and stays covered through the end of the current
// contribution period, independent of the new gross being solved for (continuation is a
// fact about the past, not something the new gross can retroactively change). Used to
// decide, upfront, whether this revision's CTC should carry employer ESI at all — kept
// separate from resolveEsi itself so the solve loop below never needs to await/mutate the
// employee document per iteration.
const isEsiContinuing = (employee) => {
  if (!employee?.otherConfigurations?.esiCoverageSince) return false;
  const { start, end } = getContributionPeriodBounds(new Date());
  const coverageSince = new Date(employee.otherConfigurations.esiCoverageSince);
  return coverageSince >= start && coverageSince <= end;
};

// Basic given an already-known Gross — solving Basic and Gross together from a target
// CTC needs closed-form algebra (see solveEarningsForCtc's iteration below for why);
// once Gross is already known, Basic follows directly with no circularity. A "% of CTC"
// Basic doesn't depend on Gross at all — it's fixed by the target CTC alone.
const solveBasicGivenGross = (basicComponent, grossSalary, globalComponentsById, monthlyCTC) => {
  const rule = effectiveRule(basicComponent, globalComponentsById);
  if (rule.calculationType === 'FIXED') return rule.amountPercentage || 0;
  if (rule.calculationType === 'PERCENTAGE') {
    const base = rule.calculationBasis === 'CTC' ? monthlyCTC : grossSalary;
    return ((rule.amountPercentage || 0) / 100) * base;
  }
  return 0;
};

// Re-solves every earning for a new target CTC against the employee's current component
// DEFINITIONS (calculation types/percentages/basis) — same algorithm as the frontend
// Dashboard Calculator, ported here so Revise Salary can run it server-side.
//
// Gross is found by fixed-point iteration rather than solveBasicAndGross's closed form:
// monthlyCTC = grossSalary + employerPf(basicSalary) + nonGrossTotal, where basicSalary
// and nonGrossTotal (the total of any components marked isPartOfGross: false — CTC
// benefits that sit outside Gross) both depend on grossSalary. With zero such benefits,
// nonGrossTotal is always 0 and this converges on the very first pass to exactly
// solveBasicAndGross's old answer (verified numerically against it) — a superset of the
// old algorithm, not a behavior change for anyone with no benefits configured.
//
// employerPfInCtc: false when EPF does not apply to the establishment for the period being
// solved — employer PF is then not part of CTC at all, so nothing is netted out of it and
// the whole CTC goes to the earnings. Every caller passes the EPF setting of the period it
// solves for, so an EPF switch flip keeps the agreed CTC and re-splits the earnings.
// Also false when the employee's own EPF is disabled (their PF deduction is INACTIVE —
// see isEpfActiveForEmployee), for the same reason.
const solveEarningsForCtc = (earningComponents, monthlyCTC, epfPolicy, globalComponentsById, esiContext = null, month = null, year = null, employerPfInCtc = true) => {
  const basicComponent = earningComponents.find((c) => c.componentName === 'Basic Salary');
  const balancingComponent = earningComponents.find((c) => isBalancingComponent(c, globalComponentsById));

  if (!basicComponent) {
    return {
      basicSalary: 0,
      grossSalary: monthlyCTC,
      earnings: [],
      warning: 'No "Basic Salary" component is configured for this employee.',
      balancingComponent,
      specialAllowanceAmount: null,
      basicComponent,
    };
  }

  let warning;
  if (basicComponent.calculationType === 'PERCENTAGE' && !((basicComponent.amountPercentage || 0) > 0)) {
    warning = 'Basic Salary percentage is not set.';
  } else if (basicComponent.calculationType !== 'FIXED' && basicComponent.calculationType !== 'PERCENTAGE') {
    warning = 'Basic Salary must be configured as Fixed or a Percentage of Gross Salary/CTC.';
  }

  // Resolves every non-Basic, non-Balancing earning's amount for a given basic/gross
  // guess. Re-run each iteration since %-of-Basic/%-of-Gross earnings shift as the guess
  // converges; Balancing is deliberately excluded here — its value is the remainder,
  // computed once after convergence, below.
  const resolveAllAmounts = (basicSalary, grossSalary) => {
    const amountCache = new Map([[basicComponent._id.toString(), basicSalary]]);

    const resolveEarningAmount = (component) => {
      if (!component) return 0;
      const key = component._id.toString();
      if (amountCache.has(key)) return amountCache.get(key);

      const rule = effectiveRule(component, globalComponentsById);
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
          // A global rule resolves its COMPONENT-basis reference by NAME
          // (calculationBasedOnName — see effectiveRule); a component's own definition
          // (no global template) resolves it by id, exactly as before.
          const base = rule.calculationBasedOnName
            ? earningComponents.find((o) => o.componentName === rule.calculationBasedOnName)
            : earningComponents.find(
                (o) => rule.calculationBasedOn && o._id.toString() === rule.calculationBasedOn.toString()
              );
          amount = ((rule.amountPercentage || 0) / 100) * resolveEarningAmount(base);
        }
      }
      amountCache.set(key, amount);
      return amount;
    };

    return earningComponents
      .filter((c) => !isBalancingComponent(c, globalComponentsById))
      .map((c) => ({
        component: c,
        calculatedAmount: c === basicComponent ? basicSalary : resolveEarningAmount(c),
      }));
  };

  let grossSalary = monthlyCTC;
  let basicSalary = solveBasicGivenGross(basicComponent, grossSalary, globalComponentsById, monthlyCTC);
  let resolved = [];

  for (let i = 0; i < 20; i += 1) {
    basicSalary = solveBasicGivenGross(basicComponent, grossSalary, globalComponentsById, monthlyCTC);
    const employerPfTotal = employerPfInCtc ? calculateEmployerPfContribution(basicSalary, epfPolicy, month, year).total : 0;
    resolved = resolveAllAmounts(basicSalary, grossSalary);
    const nonGrossTotal = resolved
      .filter((r) => r.component.isPartOfGross === false)
      .reduce((sum, r) => sum + r.calculatedAmount, 0);

    // Employer ESI counts toward CTC exactly like employer PF whenever gross is within the
    // ceiling — unconditionally, regardless of esiContext.continuing: an employee who has
    // always stayed under the ceiling gets normal netting whether or not they happen to be
    // mid-way through an ESI contribution period, same as anyone else. `continuing` only
    // actually matters for the OTHER case, gross now ABOVE the ceiling from a mid-period
    // raise — the ceiling check below already excludes netting there on its own (grossSalary
    // <= esiContext.ceiling is false), so the "spec says the company bears it on top of the
    // stated CTC instead" behavior for that case falls out for free: this loop leaves gross
    // un-netted (so the employee's package isn't reduced), while costToCompany separately
    // adds esi.employerContribution (from resolveEsi, which independently determines
    // eligibility via continuingCoverage) on top regardless — no separate "continuing"
    // branch is needed here at all.
    let employerEsi = 0;
    if (
      esiContext &&
      !esiContext.disabled &&
      grossSalary > 0 &&
      grossSalary <= esiContext.ceiling
    ) {
      employerEsi = Math.ceil(grossSalary * ESI_EMPLOYER_RATE);
    }

    const newGross = monthlyCTC - employerPfTotal - nonGrossTotal - employerEsi;
    const converged = Math.abs(newGross - grossSalary) < 0.01;
    grossSalary = newGross;
    if (converged) break;
  }

  // One final pass so `resolved`/`basicSalary` reflect the converged grossSalary exactly
  // (the loop's last resolveAllAmounts call used the pre-update guess).
  basicSalary = solveBasicGivenGross(basicComponent, grossSalary, globalComponentsById, monthlyCTC);
  resolved = resolveAllAmounts(basicSalary, grossSalary);

  const partOfGross = resolved.filter((r) => r.component.isPartOfGross !== false);
  const sumOfPartOfGross = partOfGross.reduce((sum, r) => sum + r.calculatedAmount, 0);

  // Tag with the EFFECTIVE rule (template's current definition when linked), not the raw
  // stored one — a component whose role just changed at the org level (e.g. Special
  // Allowance moving from Balancing to Fixed ₹5,000, replaced by a new Balancing
  // component) still carries its OLD frozen calculationType/basis/percentage on its own
  // override until the next persist; tagging from the raw fields would show "Balancing"
  // for a component that resolveAllAmounts/isBalancingComponent above already correctly
  // treated as no-longer-Balancing for the actual amount. Basic is the one exception —
  // its own convention (see bulkEmployeeCtc.js) always reports the resolved rupee value
  // as amountPercentage regardless of rule.
  // Rounded to the nearest paisa — this loop's arithmetic (e.g. 53927.5 * 0.1) is exact in
  // decimal but not always in IEEE-754 binary, so an unrounded result can carry noise like
  // 5392.750000000001 straight into an editable amount input.
  const roundMoney = (amount) => Math.round(amount * 100) / 100;

  const earnings = resolved.map((r) => {
    if (r.component === basicComponent) {
      return {
        componentName: r.component.componentName,
        calculationType: r.component.calculationType,
        calculationBasis: r.component.calculationBasis,
        amountPercentage: basicSalary,
        calculatedAmount: roundMoney(r.calculatedAmount),
        isPartOfGross: r.component.isPartOfGross !== false,
      };
    }
    const rule = effectiveRule(r.component, globalComponentsById);
    // A standalone COMPONENT-basis component's rule carries its raw referenced component
    // id/legacy-name in calculationBasedOn (rule.calculationBasedOnName is only set for a
    // TEMPLATED component — see effectiveRule) — neither is directly comparable by a caller
    // that only has a stable NAME to check against (e.g. EditEarningComponentModal's "is
    // this % of Basic Salary?"). Resolve it to that component's NAME here too, so this
    // earning object always exposes a name, never a raw id, matching mergeComponents.js's
    // own resolveEarnings (used identically once the current month is PAID).
    let calculationBasedOn;
    if (rule.calculationBasis === 'COMPONENT') {
      if (rule.calculationBasedOnName) {
        calculationBasedOn = rule.calculationBasedOnName;
      } else if (rule.calculationBasedOn) {
        const base =
          earningComponents.find((c) => c._id.toString() === rule.calculationBasedOn.toString()) ||
          earningComponents.find((c) => c.componentName === rule.calculationBasedOn);
        calculationBasedOn = base ? base.componentName : rule.calculationBasedOn;
      }
    }
    return {
      componentName: r.component.componentName,
      calculationType: rule.calculationType,
      calculationBasis: rule.calculationBasis,
      amountPercentage: rule.amountPercentage,
      calculatedAmount: roundMoney(r.calculatedAmount),
      isPartOfGross: r.component.isPartOfGross !== false,
      ...(calculationBasedOn ? { calculationBasedOn } : {}),
    };
  });

  let specialAllowanceAmount = null;
  if (balancingComponent) {
    // Balancing absorbs whatever's left of GROSS specifically — non-gross benefits were
    // already excluded from sumOfPartOfGross, so they don't eat into this remainder. Kept
    // as the TRUE (possibly negative) value here — callers that persist a new structure
    // (reviseSalary, redistributeBasicSalary) explicitly reject a negative
    // specialAllowanceAmount before ever saving it; only the display-facing earnings entry
    // below is floored, so a preview caller that doesn't itself reject never shows negative.
    specialAllowanceAmount = grossSalary - sumOfPartOfGross;
    const displayAmount = roundMoney(Math.max(0, specialAllowanceAmount));
    earnings.push({
      componentName: balancingComponent.componentName,
      calculationType: 'BALANCING',
      calculationBasis: balancingComponent.calculationBasis,
      amountPercentage: displayAmount,
      calculatedAmount: displayAmount,
      isPartOfGross: true,
    });
  }

  return {
    basicSalary: roundMoney(basicSalary),
    grossSalary: roundMoney(grossSalary),
    earnings,
    warning,
    balancingComponent,
    specialAllowanceAmount,
    basicComponent,
  };
};
// Exported so a brand-new employee (bulk upload) can be solved from the org's global
// templates alone — nothing in this function's body actually requires an existing
// employee's own components, just an earningComponents array shaped like SalaryComponent
// docs (global templates qualify directly). See bulkEmployeeCtc.js.
exports.solveEarningsForCtc = solveEarningsForCtc;

// Persists a resolved amount as an employee-specific override — find-or-create pattern
// already proven correct by redistributeBasicSalary and editSalaryComponent.
// Snapshots a COMPUTED rupee amount onto an employee-specific override. Freezes
// calculationType to FIXED by default — this is what makes a %-of-Basic component like
// HRA behave as "frozen at hire" on every later read, per this module's own convention.
// The ONE exception is the Balancing component (Special Allowance) — pass
// `calculationType: 'BALANCING'` explicitly for it, never "preserve whatever's already
// there": its OWN stored type must stay 'BALANCING' so solveEarningsForCtc/
// redistributeBasicSalary can keep re-identifying "which component is the remainder
// absorber" on the NEXT revision, but it can't be TRUSTED to already say that — it may be
// stuck as something else (e.g. an earlier version of this function forced every override
// to FIXED, including this one; isBalancingComponent's template fallback is what finds it
// again in that state). Explicitly setting BALANCING here, every time, self-heals that
// automatically the next time this employee's Balancing component is touched.
// resolveEarnings (see its own doc comment) already reads a persisted BALANCING
// override's amountPercentage exactly like FIXED, so this costs nothing on the display side.
const persistLiveAmount = async (
  corporateUserID,
  employeeId,
  component,
  amount,
  { calculationType = 'FIXED', calculationBasis, calculationBasedOn } = {}
) => {
  if (component.employee) {
    component.amountPercentage = amount;
    component.calculationType = calculationType;
    // Only touch these when the caller explicitly re-derives a PERCENTAGE rule (see the
    // Basic/HRA callers below) — omitted (undefined) otherwise so a FIXED/BALANCING
    // persist doesn't disturb whatever basis metadata already sits on the override.
    if (calculationBasis !== undefined) component.calculationBasis = calculationBasis;
    if (calculationBasedOn !== undefined) component.calculationBasedOn = calculationBasedOn;
    await component.save();
    return;
  }
  await SalaryComponent.create({
    corporateUser: corporateUserID,
    employee: employeeId,
    componentName: component.componentName,
    calculationType,
    amountPercentage: amount,
    calculationBasis: calculationBasis !== undefined ? calculationBasis : component.calculationBasis,
    calculationBasedOn: calculationBasedOn !== undefined ? calculationBasedOn : component.calculationBasedOn,
    status: 'ACTIVE',
    isGlobal: false,
    globalComponentId: component._id,
  });
};

// Builds persistLiveAmount's calculationBasis/calculationBasedOn options for re-persisting
// a component as a live PERCENTAGE rule, or null when the effective rule isn't a
// percentage at all. A COMPONENT-basis template's calculationBasedOn is a GLOBAL
// component's id, meaningless against the EMPLOYEE'S own override set — resolved instead
// via the template's stable calculationBasedOnName (see effectiveRule) to whichever of
// THIS employee's earnings actually carries that name, falling back to the raw id only if
// no match exists (mirrors resolveEarnings' own resolution for the same field).
const percentagePersistOptions = (rule, earningComponents) => {
  if (rule.calculationType !== 'PERCENTAGE') return null;
  let calculationBasedOn = rule.calculationBasedOn;
  if (rule.calculationBasis === 'COMPONENT' && rule.calculationBasedOnName) {
    const base = earningComponents.find((c) => c.componentName === rule.calculationBasedOnName);
    if (base) calculationBasedOn = base._id;
  }
  return { calculationBasis: rule.calculationBasis, calculationBasedOn };
};

// Months strictly between (inclusive) effectiveMonth/Year and the month before "now",
// already PAID/APPROVED/COMPLETED — these are the months arrears must cover.
const findAlreadyPaidCoveredMonths = async ({ corporateUserID, employeeId, effectiveMonth, effectiveYear }) => {
  const now = moment();
  const effective = moment({ year: effectiveYear, month: effectiveMonth - 1, day: 1 });
  if (!effective.isBefore(now, 'month')) return [];

  const salaries = await Salary.find({
    corporateUser: corporateUserID,
    employee: employeeId,
    paymentStatus: { $in: PAID_STATUSES },
  }).lean();

  return salaries.filter((s) => {
    const salaryMonth = moment({ year: s.year, month: s.month - 1, day: 1 });
    return !salaryMonth.isBefore(effective, 'month') && salaryMonth.isBefore(now, 'month');
  });
};

// The next month that hasn't already been finalized — where arrears get paid out.
// Scans forward from `startFrom` (defaulting to the current real month, for any caller
// that doesn't care about backdating), NOT always from "now" — a revision entered today
// but backdated to correct an already-paid February must pay its arrears with March (the
// very next payroll cycle after the affected month), not with whatever the real calendar
// happens to say today, however much later that revision was actually entered.
const findNextUnprocessedMonth = async ({ corporateUserID, employeeId, startFrom }) => {
  const start = startFrom
    ? moment({ year: startFrom.year, month: startFrom.month - 1, day: 1 })
    : moment();
  for (let i = 0; i < 24; i += 1) {
    const candidate = moment(start).add(i, 'months');
    const month = candidate.month() + 1;
    const year = candidate.year();
    // eslint-disable-next-line no-await-in-loop
    const existing = await Salary.findOne({
      corporateUser: corporateUserID,
      employee: employeeId,
      month,
      year,
    }).lean();
    if (!existing || !PAID_STATUSES.includes(existing.paymentStatus)) {
      return { month, year };
    }
  }
  return { month: start.month() + 1, year: start.year() };
};

exports.reviseSalary = async ({
  corporateUserID,
  employeeId,
  newAnnualCTC,
  effectiveMonth,
  effectiveYear,
  reason,
  createdBy,
  // Set by the hire flows (New Hire, Add Employee, bulk upload) recording an employee's
  // FIRST-EVER committed CTC as a version — there is no real "previous" structure to
  // capture, and getEmployeeCtcBreakdown can't reliably reconstruct one for an employee
  // that was only just created (its own reconstruction depends on a FIXED/Balancing
  // anchor that's either absent or still mid-flight at this exact moment) — surfaced as a
  // garbage "previous CTC" in Revision History otherwise. Skips straight to null/empty
  // instead of computing something misleading.
  isInitialHire = false,
}) => {
  // Capture the CTC as it stood immediately before this revision, for the history record.
  // skipBackfill: true — this call only needs the computed costToCompany, not the side
  // effect of persisting a new version; letting it backfill one here (right before this
  // function creates its OWN new version a few lines down) risks two versions landing on
  // the identical effectiveFrom, with no fully reliable way to break that tie later (see
  // getEmployeeCtcBreakdown's skipBackfill comment).
  const previousBreakdown = isInitialHire
    ? null
    : await getEmployeeCtcBreakdown({ corporateUserID, employeeId, skipBackfill: true });
  const previousAnnualCTC = previousBreakdown ? Math.round(previousBreakdown.costToCompany * 12) : null;

  // A new joiner can be the one that takes the establishment to 20 — switch EPF back on
  // (if it was off) before reading the settings below, so this hire's CTC includes PF.
  if (isInitialHire) await ensureEpfEnabledWhenMandatory(corporateUserID);

  const [earningComponents, complianceSettings, globalEarningTemplates, employeeEpfActive] = await Promise.all([
    mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
    ComplianceSettings.findOne({ corporateUser: corporateUserID }),
    // The source of truth this revision re-solves from — see effectiveRule's comment.
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
    isEpfActiveForEmployee(corporateUserID, employeeId),
  ]);
  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));

  // Snapshot the live earnings exactly as they stand before this revision, so
  // undoLatestRevision can restore them precisely. Passing globalComponentsById lets
  // resolveEarnings report the Balancing component's EFFECTIVE type (self-healed via
  // isBalancingComponent) even if its own stored calculationType is currently stuck as
  // something else, and its calculatedAmount already reads the real persisted snapshot.
  // Skipped for an initial hire — there's no prior structure to snapshot, and
  // resolveEarnings' reconstruction is unreliable this early anyway (see isInitialHire's
  // doc comment above); an empty array here is what undoLatestRevision already expects to
  // mean "nothing to restore," refusing the undo with a clear message instead of guessing.
  const resolvedPreviousEarnings = isInitialHire
    ? []
    : resolveEarnings(earningComponents, globalComponentsById, {
        monthlyCtc: previousBreakdown?.annualCtc > 0 ? previousBreakdown.annualCtc / 12 : undefined,
      }).earnings;
  const previousEarningsSnapshot = resolvedPreviousEarnings.map((e) => ({
    componentName: e.componentName,
    calculationType: e.calculationType,
    calculationBasis: e.calculationBasis,
    // A BALANCING component's live amountPercentage can genuinely be unset (e.g. it's
    // never been through a redistribute/persist cycle yet) — resolveLinear already treats
    // that as 0 for every actual calculation, but this snapshot must match, since
    // SalaryStructureVersion.previousEarnings requires the field; leaving it as
    // `undefined` here throws a validation error on the very first revision attempt.
    amountPercentage: e.amountPercentage || 0,
    calculatedAmount: e.calculationType === 'BALANCING' ? (e.amountPercentage || 0) : e.calculatedAmount,
    isPartOfGross: e.isPartOfGross,
  }));

  const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
  // A new CTC is solved under whatever EPF applicability governs its effective month —
  // with EPF off for the establishment, employer PF is simply not part of this CTC.
  // An initial hire (Add Employee, New Hire, bulk upload) is being set up NOW: its
  // effective month is the join date, often backdated before an EPF flip, but the CTC was
  // priced (and its components persisted) under the current setting — so use that, or
  // the version would record a netting its own components weren't solved with.
  // The employee's own EPF toggle off means the same: employer PF isn't part of their CTC.
  const employerPfInCtc =
    employeeEpfActive &&
    (isInitialHire
      ? isEpfApplicableForPeriod(complianceSettings)
      : isEpfApplicableForPeriod(complianceSettings, effectiveMonth, effectiveYear));
  const monthlyCTC = Number(newAnnualCTC) / 12;

  // Fetched before the solve (not after, as this used to be) so the solve loop can decide
  // whether employer ESI counts toward the entered CTC — continuation is a fact about the
  // employee's PRIOR coverage, unaffected by the new gross being solved for.
  const employee = await Employee.findById(employeeId);
  const esiContext = {
    continuing: isEsiContinuing(employee),
    ceiling: employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING,
    // Opt-out override (see resolveEsi in ctcCalculator.js) — an explicit `false` means
    // this employee's ESI is manually disabled regardless of gross, so the solve below
    // must never net employer ESI out of the entered CTC for them.
    disabled: employee?.otherConfigurations?.enableESI === false,
  };

  const { basicSalary, grossSalary, earnings, balancingComponent, specialAllowanceAmount, basicComponent } =
    solveEarningsForCtc(earningComponents, monthlyCTC, epfPolicy, globalComponentsById, esiContext, effectiveMonth, effectiveYear, employerPfInCtc);

  if (!basicComponent) {
    throw new Error('No "Basic Salary" component is configured for this employee.');
  }
  if (!balancingComponent) {
    throw new Error('No Balancing component (e.g. Special Allowance) is configured for this employee — cannot redistribute a new CTC.');
  }
  // Below-50%-of-Gross is a compliance concern, not something to block on — the frontend
  // preview already surfaces this as a warning (calculateCtcBreakdown, mirroring
  // ctcCalculator.js's identical check) before the user even submits; don't also hard-block
  // the actual revision for the same condition.
  // Checked against Basic's own EFFECTIVE rule first (see isBasicSalaryCompliant's doc
  // comment) — a "50% of Gross" rule can never be non-compliant, whatever the resolved
  // rupee amounts round to.
  const basicRuleForCompliance = effectiveRule(basicComponent, globalComponentsById);
  const basicPercentOfGrossRule = basicPercentRuleForCompliance(basicRuleForCompliance);
  const basicBelowFloorWarning = !isBasicSalaryCompliant(basicSalary, grossSalary, basicPercentOfGrossRule)
    ? 'The Basic Salary is below 50% of Gross. You may not be compliant as per the labor codes. Please double check before proceeding.'
    : null;
  if (specialAllowanceAmount < 0) {
    throw new Error("This CTC is too low to cover the employee's configured fixed/percentage earnings.");
  }

  // Purely informational (feeds esiNote below) — persist: false, since this read must NOT
  // stamp esiCoverageSince itself. The solve above already correctly used esiContext.continuing
  // from BEFORE this call (isEsiContinuing, computed off the employee as fetched); if this
  // read were allowed to write "coverage starts now" for an employee newly crossing under
  // the ceiling (e.g. isInitialHire), the very next read of this employee (often moments
  // later, e.g. viewing their Salary Structure tab) would misread that brand-new timestamp
  // as "already covered before this calculation" and pile employer ESI on top of CTC
  // instead of netting it in, even though nothing has actually continued from anywhere.
  const esi = employee ? await resolveEsi({ employee, grossSalary, persist: false }) : { eligible: false };
  let esiNote = null;
  if (esi.eligible && grossSalary > esiContext.ceiling) {
    const { end } = getContributionPeriodBounds(new Date());
    esiNote = `ESI contribution continues on the full new gross (₹${Math.round(grossSalary)}) until ${moment(end).format('MMM YYYY')} — the current contribution period — even though gross now exceeds the ₹${esiContext.ceiling} ceiling. The company bears the extra employer ESI on top of this CTC during these locked months.`;
  } else if (previousBreakdown?.esi?.eligible && !esi.eligible) {
    esiNote = 'This revision moves gross above the ESI ceiling and the current contribution period has ended — ESI coverage now stops.';
  }

  const effectiveFrom = moment({ year: effectiveYear, month: effectiveMonth - 1, day: 1 }).startOf('day').toDate();

  // Guard against silently shadowing this revision with a PHANTOM version only — a real,
  // deliberately-created later revision (any other reason) is legitimate history, and a
  // backdated correction below it is exactly what the arrears flow further down (comparing
  // against actually-PAID months, entirely independent of version ordering) already exists
  // to support; blocking that outright was wrong and broke ordinary "revise an already-paid
  // month, generate arrears for the next unpaid one" corrections.
  // A lazily auto-backfilled "Initial hire" version, by contrast, was never a deliberate
  // admin action — it's an artifact getEmployeeCtcBreakdown stamps in the background the
  // first time anyone views the tab for a legacy employee with no version yet. That one
  // must never be allowed to outrank a genuine revision, since "current version" everywhere
  // else (getEmployeeCtcBreakdown, payroll processing) picks the greatest effectiveFrom that
  // is still <= the target date — a later-dated phantom would keep outranking a real,
  // deliberately backdated revision forever, and it could never become active despite
  // saving successfully (still showing correctly in Revision History, making the failure
  // invisible until someone checks the actual CTC).
  const laterPhantomVersion = await SalaryStructureVersion.findOne({
    corporateUser: corporateUserID,
    employee: employeeId,
    effectiveFrom: { $gt: effectiveFrom },
    reason: 'Initial hire',
  }).sort({ effectiveFrom: 1 }).lean();
  if (laterPhantomVersion) {
    throw new Error(
      `An auto-generated "Initial hire" structure is on file dated ${moment(laterPhantomVersion.effectiveFrom).format('MMMM YYYY')} — this revision effective ${moment(effectiveFrom).format('MMMM YYYY')} would never become active. Choose ${moment(laterPhantomVersion.effectiveFrom).format('MMMM YYYY')} or later, or contact support to have that record cleared.`
    );
  }

  // Create the version record BEFORE any live component is mutated — everything it needs
  // (earnings, previousEarnings, previousAnnualCTC, etc.) was already computed above and
  // none of it depends on the persistLiveAmount calls below. This ordering means a
  // validation failure here (e.g. a bad snapshot) throws before anything live has changed,
  // instead of after — previously, a failed create() here still left the persistLiveAmount
  // writes below already committed from this same call, so a retry's "previous CTC" ended
  // up reading the half-applied NEW structure instead of the true prior one (visible as a
  // revision history entry reading e.g. "₹11,00,000 -> ₹11,00,000").
  const version = await SalaryStructureVersion.create({
    corporateUser: corporateUserID,
    employee: employeeId,
    effectiveFrom,
    annualCTC: Math.round(monthlyCTC * 12),
    monthlyCTC: Math.round(monthlyCTC),
    employerPfInCtc,
    previousAnnualCTC,
    previousEmployerPfInCtc: previousBreakdown ? previousBreakdown.employerPfInCtc !== false : true,
    earnings,
    previousEarnings: previousEarningsSnapshot,
    reason: reason || null,
    createdBy: createdBy || null,
  });

  // Persist live overrides so the Salary Structure tab immediately reflects the new split.
  // A component whose EFFECTIVE rule is PERCENTAGE (e.g. Basic "50% of Gross", HRA "50% of
  // Basic") is re-persisted as that live rule — the raw percent + basis, not the resolved
  // rupee amount — so a revision doesn't silently convert a percentage-linked structure
  // into static FIXED values, which would strand the NEXT revision (and the CTC tab's own
  // "50% of Gross" badge) on whatever happened to be true this month. A genuinely FIXED
  // component is unaffected — still persisted as its resolved amount, as before.
  const basicRule = effectiveRule(basicComponent, globalComponentsById);
  const basicPercentOptions = percentagePersistOptions(basicRule, earningComponents);
  if (basicPercentOptions) {
    await persistLiveAmount(corporateUserID, employeeId, basicComponent, basicRule.amountPercentage || 0, {
      calculationType: 'PERCENTAGE',
      ...basicPercentOptions,
    });
  } else {
    await persistLiveAmount(corporateUserID, employeeId, basicComponent, basicSalary);
  }
  await persistLiveAmount(corporateUserID, employeeId, balancingComponent, specialAllowanceAmount, {
    calculationType: 'BALANCING',
  });

  // Any OTHER earning that carries a globalRule (an org-templated %-of-Basic/Gross
  // component, e.g. HRA "50% of Basic") needs its own frozen override updated to the
  // newly-resolved amount too — otherwise a component stored as a FIXED snapshot at hire
  // never reflects this revision's new Basic/Gross the next time the CTC tab reads it,
  // even though the solve above correctly re-derived it for this revision's own record.
  for (const component of earningComponents) {
    if (component === basicComponent || component === balancingComponent) continue;
    const template = findGlobalTemplate(component, globalComponentsById);
    if (!template || template.calculationType === 'BALANCING') continue;
    const resolvedEarning = earnings.find((e) => e.componentName === component.componentName);
    if (resolvedEarning) {
      const rule = effectiveRule(component, globalComponentsById);
      const percentOptions = percentagePersistOptions(rule, earningComponents);
      if (percentOptions) {
        await persistLiveAmount(corporateUserID, employeeId, component, rule.amountPercentage || 0, {
          calculationType: 'PERCENTAGE',
          ...percentOptions,
        });
      } else {
        await persistLiveAmount(corporateUserID, employeeId, component, resolvedEarning.calculatedAmount);
      }
    }
  }

  // PF's employee-side deduction can have been previously frozen into a FIXED rupee
  // override the first time it exceeded the statutory ₹1,800 cap (see
  // deductionComponent.js's getEmployeeDeductionComponentsList) — a ONE-WAY freeze,
  // deliberately meant to stop this employee's PF from silently drifting if the org's
  // global PF % ever changes later. That protection backfires on a genuine, deliberate
  // revision like this one: the frozen amount would otherwise never reflect the NEW
  // basicSalary just solved above, permanently showing a stale PF deduction no matter how
  // many further revisions happen. Only re-syncs an EXISTING FIXED override — a PF still
  // on the live global PERCENTAGE template needs no action, since it already recalculates
  // correctly off the new Basic on every read.
  const pfOverride = await DeductionComponent.findOne({
    corporateUser: corporateUserID,
    employee: employeeId,
    deductionName: 'Provident Fund (PF)',
    isGlobal: false,
    calculationType: 'FIXED',
  });
  if (pfOverride) {
    const rawPf = basicSalary * 0.12;
    pfOverride.amountPercentage = epfPolicy === 'FULL_BASIC' ? rawPf : capPfAmount(rawPf, effectiveMonth, effectiveYear);
    await pfOverride.save();
  }

  // Arrears: only when the effective month is in the past and some months in between were
  // already paid under the old structure.
  const coveredSalaries = await findAlreadyPaidCoveredMonths({ corporateUserID, employeeId, effectiveMonth, effectiveYear });
  let arrears = null;

  if (coveredSalaries.length > 0) {
    // salaryInformation.grossSalary is never actually populated by buildSalaryInformation
    // (services/salary.js) — it stays at its schema default of 0 — so the paid gross for a
    // historical month has to be reconstructed from the fields that ARE written:
    // basicPay + hraAmount + daAmount + other (== the sum of that month's resolved earning
    // components, by construction of buildSalaryInformation).
    const coveredMonths = coveredSalaries.map((s) => {
      const info = s.salaryInformation || {};
      const oldGross = (info.basicPay || 0) + (info.hraAmount || 0) + (info.daAmount || 0) + (info.other || 0);
      const oldBasic = info.basicPay || 0;
      return {
        month: s.month,
        year: s.year,
        differential: Math.round(grossSalary - oldGross),
        // Basic-only slice of the differential — arrears attract PF on this portion at
        // payout (see fetchArrearsForPayout / services/salary.js's PF top-up).
        basicDifferential: Math.round(basicSalary - oldBasic),
      };
    });
    const amount = coveredMonths.reduce((sum, m) => sum + m.differential, 0);
    const basicAmount = coveredMonths.reduce((sum, m) => sum + m.basicDifferential, 0);

    if (amount !== 0) {
      // Start the search right after the LATEST already-paid covered month, not from
      // today's real calendar date — see findNextUnprocessedMonth's comment.
      const latestCoveredMonth = coveredMonths.reduce((latest, m) => {
        const candidate = moment({ year: m.year, month: m.month - 1, day: 1 });
        return !latest || candidate.isAfter(latest) ? candidate : latest;
      }, null);
      const nextAfterCovered = moment(latestCoveredMonth).add(1, 'month');
      const { month: payoutMonth, year: payoutYear } = await findNextUnprocessedMonth({
        corporateUserID,
        employeeId,
        startFrom: { month: nextAfterCovered.month() + 1, year: nextAfterCovered.year() },
      });

      arrears = await Arrears.create({
        corporateUser: corporateUserID,
        employee: employeeId,
        salaryStructureVersion: version._id,
        amount,
        basicAmount,
        coveredMonths,
        payoutMonth,
        payoutYear,
      });

      version.arrears = arrears._id;
      await version.save();
    }
  }

  return {
    version,
    arrears,
    basicSalary: Math.round(basicSalary),
    grossSalary: Math.round(grossSalary),
    specialAllowance: Math.round(specialAllowanceAmount),
    esiNote,
    warning: basicBelowFloorWarning,
  };
};

// Reverts the most recent revision — restores the live Basic Salary/Special Allowance
// overrides to exactly what they were before it, then removes the version (and its
// arrears, if unpaid). Blocked once any payroll run has actually consumed the version
// (a month at/after its effectiveFrom is already PAID/APPROVED/COMPLETED), or once its
// arrears have been paid out — at that point the revision is load-bearing history, not a
// mistake to erase.
exports.undoLatestRevision = async ({ corporateUserID, employeeId }) => {
  const version = await SalaryStructureVersion.findOne({ corporateUser: corporateUserID, employee: employeeId }).sort({
    effectiveFrom: -1,
    createdAt: -1,
  });

  if (!version) {
    throw new Error('No revision exists for this employee to undo.');
  }

  const effectiveFromMoment = moment(version.effectiveFrom);
  const paidSalaries = await Salary.find({
    corporateUser: corporateUserID,
    employee: employeeId,
    paymentStatus: { $in: PAID_STATUSES },
  }).lean();
  // A paid month at/after the revision's effective date only actually blocks the undo if
  // it was computed using THIS revision's structure. processEmpSalary writes
  // salaryInformation once, at whatever point the record is first generated (or last
  // regenerated before being locked in as PAID) — it never recomputes an already-PAID
  // record. So a record's CREATION time relative to when this revision was actually
  // entered (version.createdAt) is a reliable signal for which structure it used,
  // regardless of its calendar month: created before the revision existed => impossible
  // for it to reflect the revision, however much later it was actually approved/paid.
  // (Comparing dollar amounts against the snapshots instead would be fragile — a prorated
  // month, DOJ mid-cycle, or leave deductions can all make basicPay not exactly match
  // either snapshot even when the structure genuinely is the old/new one.)
  const consumedByPayroll = paidSalaries.some((s) => {
    const salaryMonth = moment({ year: s.year, month: s.month - 1, day: 1 });
    if (salaryMonth.isBefore(effectiveFromMoment, 'month')) return false;
    return !moment(s.createdAt).isBefore(version.createdAt);
  });
  if (consumedByPayroll) {
    throw new Error('This revision cannot be undone — a payroll run has already been recorded using its revised salary structure.');
  }

  if (version.arrears) {
    const linkedArrears = await Arrears.findById(version.arrears);
    if (linkedArrears && linkedArrears.status === 'PAID') {
      throw new Error('This revision cannot be undone — its arrears have already been paid out.');
    }
  }

  const [earningComponents, globalEarningTemplates] = await Promise.all([
    mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
  ]);
  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));
  const basicComponent = earningComponents.find((c) => c.componentName === 'Basic Salary');
  const balancingComponent = earningComponents.find((c) => isBalancingComponent(c, globalComponentsById));

  let previousBasicAmount = null;
  let previousBalancingAmount = null;
  let previousEarningsByName = null;
  let reconstructed = false;
  // Snapshot to re-persist as this employee's new current SalaryStructureVersion below —
  // already in the exact earningSnapshotSchema shape in both branches, so no rebuilding.
  let restoredEarningsSnapshot = null;

  if (version.previousEarnings && version.previousEarnings.length > 0) {
    const previousBasic = version.previousEarnings.find((e) => e.componentName === 'Basic Salary');
    const previousBalancing = version.previousEarnings.find((e) => e.calculationType === 'BALANCING');
    previousBasicAmount = previousBasic ? previousBasic.calculatedAmount : null;
    previousBalancingAmount = previousBalancing ? previousBalancing.calculatedAmount : null;
    // Same feasibility guard as the reconstruction branch below — an exact snapshot can
    // itself have been captured from an already-invalid moment (e.g. a revision made while
    // the org's fixed/percentage earnings didn't actually fit that CTC, before that got
    // rejected elsewhere), and blindly restoring a negative Balancing verbatim is exactly
    // as wrong as reconstructing one.
    if (previousBalancingAmount !== null && previousBalancingAmount < 0) {
      throw new Error("This revision can't be undone automatically — the prior salary structure was itself invalid for the org's current configured earnings. Use Revise Salary to set a valid CTC instead.");
    }
    previousEarningsByName = new Map(version.previousEarnings.map((e) => [e.componentName, e.calculatedAmount]));
    restoredEarningsSnapshot = version.previousEarnings;
    // previousEarnings and previousAnnualCTC are always written together (see reviseSalary
    // above) except for an initial-hire version, which never has a non-empty previousEarnings
    // — so reaching here with no valid previousAnnualCTC would mean a corrupted document.
    if (!(version.previousAnnualCTC > 0)) {
      throw new Error('This revision has no recoverable prior CTC and cannot be undone automatically.');
    }
  } else if (version.previousAnnualCTC > 0) {
    // This revision predates the previousEarnings snapshot (added later than this
    // revision was created) — reconstruct a best-effort prior structure by re-solving its
    // previousAnnualCTC against TODAY's global component rules, the same engine every
    // revision already uses. This won't reproduce org-rule changes made since then, but
    // restores the right CTC with a structurally valid split instead of refusing outright.
    const complianceSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });
    const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
    // Same esiContext reviseSalary()'s own solve builds (isEsiContinuing off the employee
    // as fetched) — omitting it here defaulted to null, which solveEarningsForCtc treats as
    // "employer ESI never applies," so the reconstructed Gross came out too HIGH by that
    // amount, which cascaded into a wrong (and here, actually infeasible) restored structure.
    const employee = await Employee.findById(employeeId);
    const esiContext = {
      continuing: isEsiContinuing(employee),
      ceiling: employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING,
      disabled: employee?.otherConfigurations?.enableESI === false,
    };
    const solved = solveEarningsForCtc(
      earningComponents,
      version.previousAnnualCTC / 12,
      epfPolicy,
      globalComponentsById,
      esiContext,
      null,
      null,
      isEpfApplicableForPeriod(complianceSettings) && (await isEpfActiveForEmployee(corporateUserID, employeeId))
    );
    // Mirrors reviseSalary's own feasibility check — restoring INTO a structure the current
    // org config can't actually support (e.g. a since-added Fixed allowance that didn't
    // exist back when this CTC was last valid) is just as wrong as revising into one, and
    // must refuse rather than silently persist a negative Balancing component.
    if (solved.specialAllowanceAmount < 0) {
      throw new Error("This revision can't be undone automatically — the prior CTC no longer fits the org's current configured earnings. Use Revise Salary to set a valid CTC instead.");
    }
    previousBasicAmount = solved.basicSalary;
    previousBalancingAmount = solved.specialAllowanceAmount;
    previousEarningsByName = new Map(solved.earnings.map((e) => [e.componentName, e.calculatedAmount]));
    restoredEarningsSnapshot = solved.earnings;
    reconstructed = true;
  } else {
    throw new Error('This revision has no recoverable prior CTC and cannot be undone automatically.');
  }

  // Mirrors reviseSalary's own persist logic exactly (effectiveRule + percentagePersistOptions,
  // both already imported/defined in this file) rather than always persisting FIXED — a
  // component whose role is PERCENTAGE (Basic "50% of Gross", HRA "50% of Basic") must be
  // restored as that live rule, not frozen to whatever rupee amount it resolved to right
  // before the revision, or undo would silently convert a percentage-linked structure into
  // a static FIXED one. Reads the CURRENT global template's rule (same "source of truth"
  // reviseSalary itself uses), so this stays correct even if previousEarnings' own snapshot
  // is stale/reconstructed — only a genuinely FIXED component falls back to the captured
  // previous amount.
  if (basicComponent && previousBasicAmount !== null) {
    const basicRule = effectiveRule(basicComponent, globalComponentsById);
    const basicPercentOptions = percentagePersistOptions(basicRule, earningComponents);
    if (basicPercentOptions) {
      await persistLiveAmount(corporateUserID, employeeId, basicComponent, basicRule.amountPercentage || 0, {
        calculationType: 'PERCENTAGE',
        ...basicPercentOptions,
      });
    } else {
      await persistLiveAmount(corporateUserID, employeeId, basicComponent, previousBasicAmount);
    }
  }
  if (balancingComponent && previousBalancingAmount !== null) {
    await persistLiveAmount(corporateUserID, employeeId, balancingComponent, previousBalancingAmount, {
      calculationType: 'BALANCING',
    });
  }

  // Symmetric with reviseSalary's own persistence of globalRule-driven components (e.g.
  // HRA "50% of Basic") — undo needs to restore those back to their pre-revision amount
  // too, not just Basic/Balancing, or they'd stay stuck at the revised value.
  if (previousEarningsByName) {
    for (const component of earningComponents) {
      if (component === basicComponent || component === balancingComponent) continue;
      const template = findGlobalTemplate(component, globalComponentsById);
      if (!template || template.calculationType === 'BALANCING') continue;
      const previousAmount = previousEarningsByName.get(component.componentName);
      if (previousAmount !== undefined) {
        const rule = effectiveRule(component, globalComponentsById);
        const percentOptions = percentagePersistOptions(rule, earningComponents);
        if (percentOptions) {
          await persistLiveAmount(corporateUserID, employeeId, component, rule.amountPercentage || 0, {
            calculationType: 'PERCENTAGE',
            ...percentOptions,
          });
        } else {
          await persistLiveAmount(corporateUserID, employeeId, component, previousAmount);
        }
      }
    }
  }

  // Same one-way-freeze staleness issue as reviseSalary() itself (see the matching block
  // there) — undo also changes basicSalary (back to the restored previous value), so an
  // existing FIXED PF override needs the same re-sync or it stays stuck at whatever amount
  // it was frozen to before the undo.
  if (previousBasicAmount !== null) {
    const pfOverride = await DeductionComponent.findOne({
      corporateUser: corporateUserID,
      employee: employeeId,
      deductionName: 'Provident Fund (PF)',
      isGlobal: false,
      calculationType: 'FIXED',
    });
    if (pfOverride) {
      const undoComplianceSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });
      const undoEpfPolicy = resolveEpfPolicyFromComplianceSettings(undoComplianceSettings);
      const rawPf = previousBasicAmount * 0.12;
      pfOverride.amountPercentage = undoEpfPolicy === 'FULL_BASIC' ? rawPf : Math.min(rawPf, resolvePfMonthlyCap());
      await pfOverride.save();
    }
  }

  if (version.arrears) {
    await Arrears.deleteOne({ _id: version.arrears });
  }

  // An EARLIER version already on file (e.g. this wasn't the employee's first-ever
  // revision) already correctly represents "the state before this one" — deleting the
  // undone version lets it naturally resurface as current, with its own real effectiveFrom
  // and exact stored figures, no reconstruction needed.
  //
  // Replacing THIS version in place (below) instead of deleting it — the fallback for when
  // no earlier version exists — used to always keep version's OWN effectiveFrom. That's
  // wrong whenever this version's effectiveFrom is itself later than where the restored
  // state should actually take hold (e.g. undo a September revision, revise again from
  // August — the September "Undo" record, still dated September, would then keep
  // outranking the new August revision forever, the exact shadowing bug this whole
  // "current version = greatest effectiveFrom" model is vulnerable to). Deleting whenever
  // possible sidesteps that; the in-place fallback still exists only because leaving an
  // employee with NO committed version at all forces the next CTC view to reconstruct
  // annualCTC live from grossSalary + employerPf + esi + nonGross, which drifts a few
  // paise from the true rounded figure (e.g. ₹11,99,999 instead of ₹12,00,000) because
  // Balancing's own 2-decimal rounding doesn't sum back exactly.
  const earlierVersion = await SalaryStructureVersion.findOne({
    corporateUser: corporateUserID,
    employee: employeeId,
    _id: { $ne: version._id },
    effectiveFrom: { $lt: version.effectiveFrom },
  }).lean();

  if (earlierVersion) {
    await SalaryStructureVersion.deleteOne({ _id: version._id });
  } else {
    // No earlier version to fall back on — this restored state is the employee's baseline,
    // true since before any revision, so it must never be pinned to version's own
    // (possibly much later) effectiveFrom. Anchor it to their actual join date when known,
    // same as the ctcCalculator.js backfill's identical fallback, so it can never
    // accidentally outrank a real future revision at any specific month.
    const employeeForDoj = await Employee.findById(employeeId).select('employeeInformation.dateOfJoin').lean();
    const joinDate = employeeForDoj?.employeeInformation?.dateOfJoin
      ? new Date(employeeForDoj.employeeInformation.dateOfJoin)
      : null;
    const restoredEffectiveFrom = joinDate && !Number.isNaN(joinDate.getTime())
      ? new Date(joinDate.getFullYear(), joinDate.getMonth(), 1)
      : new Date(1970, 0, 1);

    // version.previousAnnualCTC was already rounded once when this revision was first
    // made, so persisting it directly keeps the restored CTC exact.
    await SalaryStructureVersion.findByIdAndUpdate(version._id, {
      effectiveFrom: restoredEffectiveFrom,
      annualCTC: version.previousAnnualCTC,
      monthlyCTC: Math.round(version.previousAnnualCTC / 12),
      employerPfInCtc: version.previousEmployerPfInCtc !== false,
      previousAnnualCTC: null,
      earnings: restoredEarningsSnapshot,
      previousEarnings: [],
      reason: 'Undo — reverted to the prior structure',
      createdBy: null,
      arrears: null,
    });
  }

  return {
    undone: true,
    restoredBasicSalary: previousBasicAmount !== null ? Math.round(previousBasicAmount) : null,
    restoredSpecialAllowance: previousBalancingAmount !== null ? Math.round(previousBalancingAmount) : null,
    reconstructed,
  };
};

// Called from processEmpSalary (services/salary.js) alongside the existing
// Bonus/Incentive/Overtime/Reimbursement fetches, for the month a payroll run is
// currently processing — picks up any PENDING arrears whose payoutMonth/Year matches.
exports.fetchArrearsForPayout = async ({ employeeId, corporateUserID, month, year }) => {
  const pendingArrears = await Arrears.find({
    employee: employeeId,
    corporateUser: corporateUserID,
    payoutMonth: month,
    payoutYear: year,
    status: 'PENDING',
  });

  const totalArrearsPay = pendingArrears.reduce((sum, a) => sum + a.amount, 0);
  const totalArrearsBasic = pendingArrears.reduce((sum, a) => sum + (a.basicAmount || 0), 0);
  const arrearsIds = pendingArrears.map((a) => a._id);
  return { totalArrearsPay, totalArrearsBasic, arrearsIds };
};

// Called once a payroll run has actually persisted the Salary doc for that month, so a
// re-run before persistence failure doesn't prematurely mark arrears as paid.
exports.markArrearsAsPaid = async (arrearsIds) => {
  if (!arrearsIds || arrearsIds.length === 0) return;
  await Arrears.updateMany({ _id: { $in: arrearsIds } }, { $set: { status: 'PAID' } });
};

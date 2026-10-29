// Merges global + employee-specific ACTIVE components (employee-specific rows override
// the global component they reference via globalComponentId, plus any standalone
// employee-only rows) — shared by CTC breakdown resolution and the Basic Salary
// redistribution flow so both read the exact same "what's actually active" view.
// Works for both SalaryComponent (componentName) and DeductionComponent (deductionName).
const componentDisplayName = (component) =>
  (component.componentName || component.deductionName || '').trim().toLowerCase();

exports.mergeGlobalAndEmployeeComponents = async (Model, { corporateUserID, employeeId }) => {
  const [globalComponents, employeeComponents] = await Promise.all([
    Model.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }),
    // Fetch the employee's rows regardless of status here — an INACTIVE override still
    // needs to be seen below so it can suppress the global component it overrides.
    // Filtering to ACTIVE at the query level (as this used to) makes an INACTIVE override
    // invisible, silently falling back to the always-ACTIVE global row instead of turning
    // the component off — exactly backwards from what "toggle this off for this employee"
    // (e.g. Statutory Components' EPF/ESI/Professional Tax switches) is supposed to do.
    Model.find({ corporateUser: corporateUserID, employee: employeeId }),
  ]);

  const employeeOverrideMap = new Map(
    employeeComponents
      .filter((component) => component.globalComponentId)
      .map((component) => [component.globalComponentId.toString(), component])
  );
  // Self-healing fallback for an override created before it was ever linked to its global
  // template (globalComponentId still null, e.g. from an onboarding submission that
  // didn't have isGlobal flagged at that moment) — matched by name instead, so it
  // correctly REPLACES the global row below instead of appearing alongside it as a
  // phantom duplicate ("Provident Fund (PF)" shown twice with the same amount).
  const employeeOverrideByName = new Map(
    employeeComponents
      .filter((component) => !component.globalComponentId)
      .map((component) => [componentDisplayName(component), component])
  );

  const usedEmployeeIds = new Set();
  const merged = globalComponents
    .map((globalComponent) => {
      const override =
        employeeOverrideMap.get(globalComponent._id.toString()) ||
        employeeOverrideByName.get(componentDisplayName(globalComponent));
      if (override) usedEmployeeIds.add(override._id.toString());
      return override || globalComponent;
    })
    .filter((component) => component.status !== 'INACTIVE');
  const globalNames = new Set(globalComponents.map(componentDisplayName));
  // Any employee-specific ACTIVE row not already surfaced above still needs to show up
  // here — whether it never had a globalComponentId, or its globalComponentId pointed at
  // a template that's since gone INACTIVE (e.g. an admin retired/renamed that earning,
  // like "Special Allowance" -> "Other Allowance"). Previously this only rescued rows with
  // NO globalComponentId at all, so an override tied to a since-deactivated template was
  // silently dropped from every downstream calculation (Gross, CTC, deductions) even
  // though it was still genuinely active for that employee.
  const standaloneEmployeeComponents = employeeComponents.filter(
    (component) =>
      component.status === 'ACTIVE' &&
      !usedEmployeeIds.has(component._id.toString()) &&
      // Already represented above via the name-matched override — including it again
      // here would reintroduce the exact duplicate this fallback exists to prevent.
      !globalNames.has(componentDisplayName(component))
  );
  merged.push(...standaloneEmployeeComponents);

  return merged;
};

// The global template a component effectively overrides — its own globalComponentId link
// when that resolves to a real, active template, falling back to a NAME match against the
// org's global templates otherwise. Component names are already the stable cross-org
// identifier everywhere else in this codebase (e.g. calculationBasedOnName below, or
// isProvidentFundDeduction's exact-name check) — extending that same convention to the
// primary link itself means an employee row that was added without ever being wired to
// the matching global template (globalComponentId never set, or pointing at a stale/
// deleted one) still gets treated as an override of it, rather than silently behaving
// like a fully custom component forever. Only exact componentName matches within the SAME
// org's active templates qualify, so this can't cross-link unrelated orgs or misfire on a
// genuinely custom component that happens not to share a name with any template.
const findGlobalTemplate = (component, globalComponentsById) => {
  if (!globalComponentsById) return null;
  if (component.globalComponentId) {
    const byId = globalComponentsById.get(component.globalComponentId.toString());
    if (byId) return byId;
  }
  for (const template of globalComponentsById.values()) {
    if (template.componentName === component.componentName) return template;
  }
  return null;
};
exports.findGlobalTemplate = findGlobalTemplate;

// Whether a component plays the Balancing/remainder role. When it's linked to a global
// template, the TEMPLATE's current role wins over the component's own persisted type —
// both to self-heal a component whose own type is stuck as something other than BALANCING
// (e.g. an earlier version of persistLiveAmount briefly forced every override to FIXED,
// including this one — without this fallback that component becomes permanently
// unidentifiable as "the remainder absorber", and every future revision fails outright
// with "No Balancing component configured"), AND for the reverse case: an org reconfigures
// a component that USED to be Balancing (e.g. Special Allowance) into a plain Fixed/
// Percentage rule and adds a new Balancing component to replace it — without preferring the
// template here, the old component's frozen override would keep reporting as Balancing
// forever (and would keep winning the `.find()` that picks the sole absorber during a
// revision, since it never stops looking like one). A component with NO template link
// (standalone/custom, or a Balancing template with no override yet) has only its own type
// to go on.
const isBalancingComponent = (component, globalComponentsById) => {
  const template = findGlobalTemplate(component, globalComponentsById);
  if (template) return template.calculationType === 'BALANCING';
  return component.calculationType === 'BALANCING';
};
exports.isBalancingComponent = isBalancingComponent;

// Normalizes a PERCENTAGE rule's basis to one of CTC / GROSS_SALARY / BASIC_SALARY /
// COMPONENT (with the referenced component's NAME), so rules stored in different legacy
// shapes compare and resolve the same way.
const normalizeRuleBasis = (calculationBasis, basedOn, globalComponentsById) => {
  if (calculationBasis === 'CTC') {
    // Checked first — a CTC-basis template carries no calculationBasedOn, which the
    // legacy no-reference branch below would otherwise misread as "% of Basic Salary".
    return { calculationBasis: 'CTC', calculationBasedOnName: null };
  }
  if (calculationBasis === 'GROSS_SALARY' || basedOn === 'GROSS_SALARY') {
    return { calculationBasis: 'GROSS_SALARY', calculationBasedOnName: null };
  }
  if (calculationBasis === 'BASIC_SALARY' || !basedOn || basedOn === 'Basic Salary') {
    // Many real orgs' templates (HRA etc.) predate calculationBasis/calculationBasedOn
    // entirely and carry no reference at all — treating that as unresolvable (0) rather
    // than the near-universal real convention "% of Basic Salary" is what was silently
    // zeroing out HRA for these orgs (confirmed live via mergeComponents' resolveLinear,
    // which had the identical gap). Matches salaryComponent.js's own legacy default for
    // exactly this shape.
    return { calculationBasis: 'BASIC_SALARY', calculationBasedOnName: null };
  }
  // COMPONENT-basis templates store calculationBasedOn as the referenced GLOBAL
  // component's id — meaningless against the EMPLOYEE'S merged component list, since an
  // overridden component's id differs from its global template's id. Resolve to the
  // referenced component's NAME instead, stable across both namespaces. Some legacy
  // data stores the referenced component's NAME directly in calculationBasedOn instead
  // of an id — falls back to treating the raw value as the name itself.
  const byId = globalComponentsById?.get(basedOn.toString());
  return { calculationBasis: 'COMPONENT', calculationBasedOnName: byId ? byId.componentName : basedOn };
};

// Whether an employee-specific rule deviates from the global template it's linked to —
// i.e. HR changed it (e.g. Basic "40% of CTC" during Add Employee where the org default
// is 50%). Such a row must be saved with overridesGlobalRule, otherwise effectiveRule
// re-solves it from the template and the next revision (including the initial-hire one)
// silently resets it to org policy. Fields the caller didn't send count as unchanged.
exports.differsFromGlobalRule = (rule, template, globalComponentsById) => {
  if (!template || template.calculationType === 'BALANCING') return false;
  const calculationType = rule.calculationType ?? template.calculationType;
  if (calculationType !== template.calculationType) return true;

  const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;
  if (rule.amountPercentage !== undefined && round2(rule.amountPercentage) !== round2(template.amountPercentage)) {
    return true;
  }
  if (calculationType !== 'PERCENTAGE' || rule.calculationBasis === undefined) return false;

  // "% of the Basic Salary component" and "% of BASIC_SALARY" are the same rule stored two ways
  const comparableBasis = (basis, basedOn) => {
    const normalized = normalizeRuleBasis(basis, basedOn, globalComponentsById);
    return normalized.calculationBasis === 'COMPONENT' && normalized.calculationBasedOnName === 'Basic Salary'
      ? { calculationBasis: 'BASIC_SALARY', calculationBasedOnName: null }
      : normalized;
  };
  const submitted = comparableBasis(rule.calculationBasis, rule.calculationBasedOn);
  const original = comparableBasis(template.calculationBasis, template.calculationBasedOn);
  return (
    submitted.calculationBasis !== original.calculationBasis ||
    submitted.calculationBasedOnName !== original.calculationBasedOnName
  );
};

// The rule to actually SOLVE a component with — the org's current global-template rule
// when this component is an override of one (e.g. Basic "50% of Gross", HRA "50% of
// Basic"), falling back to the component's own definition otherwise (a standalone,
// genuinely custom component with no global counterpart, or a Balancing template, which
// is never used as a rule source since Balancing is always resolved as the remainder).
//
// This matters because every real hired employee has Basic (and other %-derived earnings)
// frozen as a concrete FIXED rupee override at hire time, by the CTC Calculator, rather
// than a live percentage — re-solving from that frozen snapshot would never let an edit
// move them at all. Re-solving from the org's CURRENT global rule instead makes both
// Revise Salary and the simpler Edit Basic Salary redistribution behave exactly like "the
// same engine that priced the hire rebuilds the structure": Basic re-derives as 50% of
// the (new) Gross, HRA as 50% of the (new) Basic, etc. Shared by reviseSalary.js and
// salaryComponent.js's redistributeBasicSalary so both editing surfaces agree.
exports.effectiveRule = (component, globalComponentsById) => {
  // A component the employee's own row explicitly marks as overriding the template
  // (redistributeBasicSalary/redistributeEarningComponent) is a deliberate, permanent
  // deviation from org policy — resolve it from THIS row's own values, exactly like a
  // fully standalone/custom component, rather than re-deriving from the (unchanged) global
  // template and silently discarding the override on the very next re-solve.
  const template = component.overridesGlobalRule ? null : findGlobalTemplate(component, globalComponentsById);
  if (template && template.calculationType !== 'BALANCING') {
    return {
      calculationType: template.calculationType,
      amountPercentage: template.amountPercentage,
      ...normalizeRuleBasis(template.calculationBasis, template.calculationBasedOn, globalComponentsById),
    };
  }
  return {
    calculationType: component.calculationType,
    amountPercentage: component.amountPercentage,
    calculationBasis:
      component.calculationBasis === 'COMPONENT' && !component.calculationBasedOn
        ? 'BASIC_SALARY'
        : component.calculationBasis,
    calculationBasedOn: component.calculationBasedOn,
  };
};

// The percentage to hand isBasicSalaryCompliant as its rule shortcut, or null when Basic's
// rule can't vouch for compliance on its own. "X% of CTC" qualifies alongside "X% of
// Gross": Gross never exceeds CTC (CTC = Gross + employer PF/ESI + non-gross benefits), so
// Basic >= 50% of CTC already guarantees Basic >= 50% of Gross.
exports.basicPercentRuleForCompliance = (rule) =>
  rule &&
  rule.calculationType === 'PERCENTAGE' &&
  (rule.calculationBasis === 'GROSS_SALARY' || rule.calculationBasis === 'CTC')
    ? rule.amountPercentage || 0
    : null;

// Basic Salary must be at least 50% of Gross to comply with the Labour Codes. Comparing
// raw rupee amounts with a strict `<` is unreliable: Basic is very often a value that was
// itself rounded to the nearest paisa when persisted (e.g. exactly 50% of a ₹1,07,916.67
// Gross is ₹53,958.335, which can only ever be STORED as ₹53,958.33 or ₹53,958.34), so a
// strict less-than comparison against a freshly recomputed Gross can flag a genuinely-50%
// Basic as non-compliant purely from that paisa-level rounding (see the false-positive
// report this fixes: Basic exactly "50% of Gross" started showing the warning after a
// Revise Salary, purely because the resolved rupee amounts landed on a rounding boundary).
//
// Two independent safeguards, either of which is enough to avoid the false positive:
//  1. `basicPercentOfGrossRule` — when Basic's own rule is known to be "X% of Gross" with
//     X >= 50, it can never be non-compliant, whatever the resolved rupee amounts say.
//     Pass this whenever the caller has it (a live PERCENTAGE/GROSS_SALARY rule, or a
//     percentage the user is directly entering); omit it (null/undefined) otherwise.
//  2. Otherwise (a FIXED Basic, or no rule available), compare on the PERCENTAGE rounded
//     to one decimal place rather than the raw rupee amounts — absorbs any paisa-level
//     rounding while still catching a genuinely low Basic (e.g. ₹40,000 on a ₹1,00,000
//     Gross rounds to 40.0%, still well under the 50.0% floor).
exports.isBasicSalaryCompliant = (basicSalary, grossSalary, basicPercentOfGrossRule) => {
  if (!(grossSalary > 0)) return true;
  if ((basicPercentOfGrossRule || 0) >= 50) return true;
  const percentOfGross = Math.round((basicSalary / grossSalary) * 1000) / 10;
  return percentOfGross >= 50;
};

// Resolves each earning's monthly amount. A BALANCING component's role (Basic/HRA/etc
// re-solve it as "Gross minus everything else" during a revision or redistribution) is
// deliberately kept OUT of this general resolver — those callers compute its new value
// themselves and persist it via persistLiveAmount/persistAmount, which freezes the actual
// rupee amount into amountPercentage while intentionally PRESERVING calculationType:
// 'BALANCING' (never renaming it to FIXED), because that type is exactly how
// solveEarningsForCtc/redistributeBasicSalary re-identify "which component is the
// remainder absorber" on the NEXT revision. Given that, a BALANCING component with an
// existing override is functionally just a frozen snapshot like FIXED — this resolver
// reads amountPercentage for it the same way, so "what does this employee currently have"
// (the CTC tab, arrears reconstruction, etc.) shows the real persisted amount rather than
// always 0. A BALANCING component that's never been persisted at all (still just the raw
// global template, no override) has no rupee amount to read yet, so amountPercentage is
// naturally 0/undefined and this safely falls through to the same non-crashing 0 as
// before — not a behavior change for an employee who's never had a redistribution run.
// GROSS_SALARY-basis PERCENTAGE components (e.g. Basic persisted as "50% of Gross" via
// Edit Basic Salary's percentage mode) are resolved via the fixed-point iteration below,
// since Gross itself is the sum of earnings including that one.
// `globalComponentsById` (optional) — when a component is an employee-specific override
// of a global template (globalComponentId set), attaches that template's ORIGINAL rule
// as `globalRule` on the returned earning, alongside (not replacing) the override's own
// actual stored calculationType/amountPercentage. Consumers that need to re-solve a
// structure from org policy rather than a frozen snapshot (Revise Salary) use `globalRule`
// when present; consumers just displaying "what this employee currently has" (the Salary
// Structure tab) keep reading the top-level fields, unaffected either way.
// `monthlyCtc` (optional) — the employee's committed monthly CTC, which a CTC-basis
// PERCENTAGE earning (Basic "40% of CTC") resolves against as a plain constant. Callers
// with no committed CTC to hand (a brand-new hire, a legacy employee with no version yet)
// omit it, and such an earning falls back to the same percentage of Gross — a close
// stand-in that's only ever an intermediate figure, since every committed-CTC path
// re-solves exactly through solveEarningsForCtc.
exports.resolveEarnings = (components, globalComponentsById, { monthlyCtc } = {}) => {
  const componentMap = new Map(components.map((c) => [c._id.toString(), { ...c._doc, linear: null }]));

  // A GROSS_SALARY-basis PERCENTAGE earning (Basic re-derived as "50% of Gross") creates a
  // circularity: Gross is the sum of earnings, one of which is itself a percentage OF
  // Gross. Rather than approximate this with iteration (which only ever converges to a
  // residual, never landing on an exact rupee figure — visibly "₹99,999.98/month" instead
  // of ₹1,00,000), every component is resolved to a LINEAR function of Gross instead:
  // amount = constant + coefficient * Gross (a FIXED/BALANCING leaf is {constant, 0}; a
  // GROSS_SALARY-basis leaf is {0, pct}; every other rule just combines its base's linear
  // form the same way algebra would). Since Gross is exactly the sum of those linear
  // earnings, it solves in closed form: Gross = ΣconstantsΣ / (1 - Σcoefficients).
  const resolveLinear = (componentId) => {
    const component = componentMap.get(componentId);
    if (!component) return { constant: 0, coefficient: 0 };
    if (component.linear) return component.linear;

    let linear = { constant: 0, coefficient: 0 };
    // Placeholder while resolving, so a genuine circular reference (already an existing,
    // unguarded risk in this resolver) unwinds as zero instead of recursing forever.
    component.linear = linear;

    const pct = (component.amountPercentage || 0) / 100;
    const basedOn = component.calculationBasedOn;
    if (component.calculationType === 'FIXED') {
      linear = { constant: component.amountPercentage || 0, coefficient: 0 };
    } else if (component.calculationType === 'PERCENTAGE') {
      // Many real orgs' percentage earnings (HRA etc.) were configured before
      // calculationBasis/calculationBasedOn existed, or via an even older form that stored
      // the literal sentinel string 'GROSS_SALARY' or a component's NAME directly in
      // calculationBasedOn instead of a real id — none of those match componentMap's
      // id-keyed lookup, so without this they silently resolve to 0 (confirmed live: a
      // real org's HRA at 20% of a ₹20,000 Basic was calculating as ₹0/month). Basic
      // Salary is the default basis when there's no resolvable reference at all, matching
      // calculateComponentAmounts' own legacy convention in salaryComponent.js ("% of
      // Basic or gross (default behavior when no parent component)").
      if (component.calculationBasis === 'CTC') {
        linear = monthlyCtc > 0 ? { constant: pct * monthlyCtc, coefficient: 0 } : { constant: 0, coefficient: pct };
      } else if (component.calculationBasis === 'GROSS_SALARY' || basedOn === 'GROSS_SALARY') {
        linear = { constant: 0, coefficient: pct };
      } else if (component.calculationBasis === 'BASIC_SALARY' || !basedOn || basedOn === 'Basic Salary') {
        const basic = components.find((c) => c.componentName === 'Basic Salary');
        const base = basic ? resolveLinear(basic._id.toString()) : { constant: 0, coefficient: 0 };
        linear = { constant: pct * base.constant, coefficient: pct * base.coefficient };
      } else {
        const key = basedOn.toString();
        const baseComponent = componentMap.get(key) || components.find((c) => c.componentName === basedOn);
        const base = baseComponent ? resolveLinear(baseComponent._id.toString()) : { constant: 0, coefficient: 0 };
        linear = { constant: pct * base.constant, coefficient: pct * base.coefficient };
      }
    } else if (component.calculationType === 'BALANCING') {
      // Reads the frozen snapshot exactly like FIXED — see module doc comment above. Floored
      // at 0 — the Balancing component must never display/report a negative amount, even if
      // whatever's persisted somehow ended up negative (e.g. stale data from before this
      // floor existed elsewhere).
      linear = { constant: Math.max(0, component.amountPercentage || 0), coefficient: 0 };
    }

    component.linear = linear;
    return linear;
  };

  let sumConstants = 0;
  let sumCoefficients = 0;
  for (const component of components) {
    if (component.isPartOfGross === false) continue;
    const linear = resolveLinear(component._id.toString());
    sumConstants += linear.constant;
    sumCoefficients += linear.coefficient;
  }
  // sumCoefficients reaching 1 (or above) means Gross-basis earnings alone claim 100%+ of
  // Gross — not a solvable structure (and blocked well before this point by the 50%-of-
  // Gross Basic floor elsewhere); falls back to the constant-only sum rather than dividing
  // by zero/negative.
  const grossEstimate = sumCoefficients >= 1 ? sumConstants : sumConstants / (1 - sumCoefficients);

  const resolve = (componentId) => {
    const linear = resolveLinear(componentId);
    return linear.constant + linear.coefficient * grossEstimate;
  };

  const earnings = components.map((component) => {
    const earning = {
      id: component._id.toString(),
      componentName: component.componentName,
      // Reports the EFFECTIVE type, not necessarily the raw stored one — a component
      // whose own calculationType is stuck as something else (e.g. FIXED, from an earlier
      // bug in persistLiveAmount/persistAmount) but whose role is Balancing (per
      // isBalancingComponent's template check) is reported as 'BALANCING' here, so every
      // consumer of this earnings array (the CTC tab, Revise Salary's preview, Edit Basic
      // Salary's preview) can identify "the remainder component" the same simple way —
      // `earning.calculationType === 'BALANCING'` — without each needing its own copy of
      // the self-healing lookup this file already does for the solve/redistribute engines.
      calculationType: isBalancingComponent(component, globalComponentsById) ? 'BALANCING' : component.calculationType,
      calculationBasis: component.calculationBasis,
      amountPercentage: component.amountPercentage,
      // Rounded to the nearest paisa — resolve()'s arithmetic (e.g. 53927.5 * 0.1) is
      // exact in decimal but not always in IEEE-754 binary, so an unrounded result can
      // carry noise like 5392.750000000001 straight into an editable amount input.
      calculatedAmount: Math.round(resolve(component._id.toString()) * 100) / 100,
      // Defaults true for any pre-existing component that predates this field, so gross
      // is unchanged unless a component has been explicitly marked otherwise.
      isPartOfGross: component.isPartOfGross !== false,
    };
    // A standalone COMPONENT-basis component's own calculationBasedOn is a raw referenced
    // component id (or, for older data, a literal name) — not directly comparable by a
    // caller that only has a stable NAME to check against (e.g. EditEarningComponentModal's
    // "is this % of Basic Salary?"). Resolve it to that component's NAME here, same
    // convention globalRule.calculationBasedOnName already uses for a TEMPLATED component's
    // reference (effectiveRule below) — this earning object should never expose a raw id.
    if (component.calculationBasis === 'COMPONENT' && component.calculationBasedOn) {
      const base =
        components.find((c) => c._id.toString() === component.calculationBasedOn.toString()) ||
        components.find((c) => c.componentName === component.calculationBasedOn);
      earning.calculationBasedOn = base ? base.componentName : component.calculationBasedOn;
    }
    const template = component.overridesGlobalRule ? null : findGlobalTemplate(component, globalComponentsById);
    if (template && template.calculationType !== 'BALANCING') {
      // Reuse effectiveRule (this file's single source of truth for "what rule actually
      // governs this component") instead of a second, independent copy of its
      // COMPONENT-basis/name-resolution/no-reference-defaults-to-Basic logic — a previous
      // duplicate here silently drifted out of sync with effectiveRule's own bugfixes.
      const rule = exports.effectiveRule(component, globalComponentsById);
      earning.globalRule = {
        calculationType: rule.calculationType,
        amountPercentage: rule.amountPercentage,
        calculationBasis: rule.calculationBasis,
        calculationBasedOnName: rule.calculationBasedOnName,
      };
    }
    return earning;
  });

  // Display order is otherwise whatever Mongo's natural/insertion order happens to be —
  // a standalone (non-global-linked) component or a global template inserted later both
  // land wherever that order puts them, which is how HRA has ended up rendering below
  // Conveyance/Mobile Allowance. Basic Salary and HRA are pinned to the top; everything
  // else keeps its existing relative order (stable sort, unlisted names fall through to
  // Infinity so they're untouched).
  const EARNINGS_PRIORITY_ORDER = ['Basic Salary', 'House Rent Allowance'];
  earnings.sort((a, b) => {
    const orderA = EARNINGS_PRIORITY_ORDER.indexOf(a.componentName);
    const orderB = EARNINGS_PRIORITY_ORDER.indexOf(b.componentName);
    return (orderA === -1 ? Infinity : orderA) - (orderB === -1 ? Infinity : orderB);
  });

  const basicSalary = earnings.find((e) => e.componentName === 'Basic Salary')?.calculatedAmount || 0;
  const grossSalary = earnings.filter((e) => e.isPartOfGross).reduce((sum, e) => sum + e.calculatedAmount, 0);
  // Components that count toward CTC but not Gross (e.g. a company-paid benefit) — the
  // caller is responsible for adding this back into costToCompany, since it's excluded
  // from Gross here.
  const nonGrossTotal = earnings.filter((e) => !e.isPartOfGross).reduce((sum, e) => sum + e.calculatedAmount, 0);

  return { earnings, basicSalary, grossSalary, nonGrossTotal };
};

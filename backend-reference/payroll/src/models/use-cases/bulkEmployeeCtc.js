const SalaryComponent = require('../entities/salaryComponent');
const DeductionComponent = require('../entities/deductionComponent');
const ComplianceSettings = require('../entities/complianceSettings');
const Employee = require('../entities/employee');
const { solveEarningsForCtc } = require('./reviseSalary');
const { calculateSingleDeductionAmount, isProvidentFundDeduction } = require('./salaryComponent');
const { resolveEsi, ESI_WAGE_CEILING, ESI_WAGE_CEILING_DIFFERENTLY_ABLED } = require('./ctcCalculator');
const {
  calculateEmployerPfContribution,
  resolveEpfPolicyFromComplianceSettings,
  isEpfApplicableForPeriod,
} = require('../../services/calculateEmployerPf');
const { ensureProvidentFundDeductionExists } = require('./complianceSettings');

// Same deduction resolver ctcCalculator.js's resolveDeductions uses for an existing
// employee's merged deductions — reused directly here since it's already a pure function
// of (components, basicSalary, grossSalary, pfPolicy) with no employeeId dependency.
const resolveDeductions = (components, { basicSalary, grossSalary, pfPolicy }) => {
  const deductions = components.map((component) => ({
    deductionName: component.deductionName,
    calculationType: component.calculationType,
    salaryDeductionType: component.salaryDeductionType,
    amountPercentage: component.amountPercentage,
    calculationBasis: component.calculationBasis,
    globalComponentId: component._id,
    calculatedAmount: calculateSingleDeductionAmount({
      calculationType: component.calculationType,
      amountPercentage: component.amountPercentage,
      calculationBasis: component.calculationBasis,
      salaryDeductionType: component.salaryDeductionType,
      deductionName: component.deductionName,
      basicSalary,
      grossSalaryBase: grossSalary,
      pfPolicy,
    }),
  }));
  const totalDeductions = deductions.reduce((sum, d) => sum + d.calculatedAmount, 0);
  return { deductions, totalDeductions };
};

// Solves a full CTC breakdown for a BRAND-NEW employee — no existing SalaryComponent/
// DeductionComponent overrides yet, just the org's global templates (e.g. "Basic = 50% of
// Gross", "HRA = 50% of Basic", a Balancing component) plus a target monthly CTC. This is
// the same engine Revise Salary uses (solveEarningsForCtc), fed the global templates
// directly instead of an existing employee's merged components — nothing in that engine
// actually requires an employeeId, only an array shaped like SalaryComponent docs, which
// the global templates already are.
//
// `employeeId` is required (not just corporateUserID) because ESI eligibility
// (resolveEsi) reads/writes otherConfigurations.esiCoverageSince on the Employee
// document — bulk upload creates the Employee row first, then calls this per employee.
exports.solveCtcBreakdownForNewEmployee = async ({ corporateUserID, employeeId, monthlyCTC }) => {
  // Guarantees PF is deducted even for an org that's never explicitly saved Compliance
  // Settings > EPF — see ensureProvidentFundDeductionExists's comment.
  await ensureProvidentFundDeductionExists(corporateUserID);

  const [globalEarningTemplates, globalDeductionTemplates, complianceSettings, employee] = await Promise.all([
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }),
    DeductionComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }),
    ComplianceSettings.findOne({ corporateUser: corporateUserID }),
    Employee.findById(employeeId),
  ]);

  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));
  const pfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
  // With EPF off for the establishment, a new hire's CTC carries no PF at all — nothing is
  // netted out of it and no PF deduction is shown.
  const epfApplicable = isEpfApplicableForPeriod(complianceSettings);
  const deductionTemplates = epfApplicable
    ? globalDeductionTemplates
    : globalDeductionTemplates.filter((d) => !isProvidentFundDeduction(d.deductionName));

  // Employer ESI counts toward CTC exactly like employer PF (see reviseSalary.js's
  // identical esiContext) — without it, the solve leaves employer ESI out of the target
  // CTC entirely and costToCompany below then adds it back on top, overshooting the
  // entered Annual CTC by the annual employer ESI amount. A brand-new hire can never be
  // an ESI continuation (no prior esiCoverageSince exists yet), so continuing is always
  // false here, unlike reviseSalary's isEsiContinuing check.
  const esiContext = {
    continuing: false,
    ceiling: employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING,
    disabled: employee?.otherConfigurations?.enableESI === false,
  };

  const { basicSalary, grossSalary, earnings: rawEarnings, warning, specialAllowanceAmount } = solveEarningsForCtc(
    globalEarningTemplates,
    monthlyCTC,
    pfPolicy,
    globalComponentsById,
    esiContext,
    null,
    null,
    { epfActive: epfApplicable }
  );
  // Mirrors reviseSalary()'s identical feasibility check — without it, a bulk row whose
  // fixed/percentage earnings don't fit its Annual CTC silently got a floored-to-0 Balancing
  // component instead of being rejected, unlike every other creation path. The caller
  // (bulkCreate) catches this per-employee so one infeasible row doesn't abort the batch.
  if (specialAllowanceAmount < 0) {
    throw new Error("This CTC is too low to cover the employee's configured fixed/percentage earnings.");
  }
  // solveEarningsForCtc's output doesn't carry an id (it's shared with reviseSalary.js,
  // which resolves against an employee's OWN components and never needed one) — since
  // every earning here came from a global template, attach that template's _id by name so
  // the caller can persist a properly-linked override from the very first save.
  const earningTemplateByName = new Map(globalEarningTemplates.map((t) => [t.componentName, t]));
  const earnings = rawEarnings.map((earning) => {
    const template = earningTemplateByName.get(earning.componentName);
    const isPercentage = earning.calculationType === 'PERCENTAGE';
    return {
      ...earning,
      // solveEarningsForCtc always reports Basic's amountPercentage as its resolved
      // RUPEE value, not its raw percent — that's correct for reviseSalary.js's own
      // "freeze Basic to FIXED on every revision" convention, but wrong here: a
      // brand-new bulk-uploaded employee should start with whatever LIVE rule the org's
      // global template actually defines (e.g. "50% of Gross"), not a frozen snapshot —
      // matching how Add Employee now persists a chosen percentage rule verbatim rather
      // than freezing it. Re-read the raw percent from the template itself instead.
      amountPercentage: isPercentage ? template?.amountPercentage ?? earning.amountPercentage : earning.amountPercentage,
      globalComponentId: template?._id || null,
    };
  });

  const { deductions: resolvedDeductions } = resolveDeductions(deductionTemplates, {
    basicSalary,
    grossSalary,
    pfPolicy,
  });

  // Professional Tax starts INACTIVE for every newly added employee (same as Labour
  // Welfare Fund — see otherConfigurations.professionalTax's schema default) — unlike
  // LWF, it's actually backed by a per-employee DeductionComponent row (see
  // controller/employee.js's deductionComponentPayload), so it's still computed and
  // returned here (a correct amount is ready the moment HR flips it on), but tagged so
  // the caller persists it INACTIVE, and excluded from the totals below so the CTC
  // preview's Net Take-Home matches what will actually be paid out.
  const deductions = resolvedDeductions.map((d) => ({
    ...d,
    startsInactive: d.deductionName === 'Professional Tax',
  }));
  const activeDeductionsSubtotal = deductions
    .filter((d) => !d.startsInactive)
    .reduce((sum, d) => sum + d.calculatedAmount, 0);

  const isEpfActive = deductions.some((d) => isProvidentFundDeduction(d.deductionName));
  const employerPf = isEpfActive
    ? calculateEmployerPfContribution(basicSalary, pfPolicy)
    : { pfWage: 0, ceiling: 0, employeeEpf: 0, employerEps: 0, employerEpf: 0, edli: 0, adminCharges: 0, employerTotal: 0, totalDeposit: 0, total: 0 };

  // persist: false — a brand-new hire can never be an ESI continuation (see esiContext
  // above), so there's nothing genuine to stamp yet; letting this write "coverage starts
  // now" here would prematurely mark it before the employee's own first real read of their
  // CTC (see ctcCalculator.js/reviseSalary.js's identical fix). The returned eligibility/
  // amount used below for costToCompany is unaffected by persist either way.
  const esi = await resolveEsi({ employee, grossSalary, persist: false });
  const totalDeductions = activeDeductionsSubtotal + esi.employeeContribution;
  // Matches ctcCalculator.js's getEmployeeCtcBreakdown formula for an existing employee —
  // a benefit marked isPartOfGross: false was already netted out of grossSalary during the
  // solve above, so it must be added back here or the reported Cost to Company would
  // silently exclude it (only matters for orgs with such a benefit component configured).
  const nonGrossTotal = earnings
    .filter((e) => e.isPartOfGross === false)
    .reduce((sum, e) => sum + e.calculatedAmount, 0);
  const costToCompany = grossSalary + employerPf.total + esi.employerContribution + nonGrossTotal;
  const netTakeHome = grossSalary - totalDeductions;

  return {
    basicSalary,
    grossSalary,
    earnings,
    deductions,
    employerPf,
    esi,
    costToCompany,
    annualCtc: costToCompany * 12,
    totalDeductions,
    netTakeHome,
    warning,
  };
};

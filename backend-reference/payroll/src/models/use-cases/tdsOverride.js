const { ObjectId } = require('mongoose').Types;
const TdsOverride = require('../entities/tdsOverride');
const Employee = require('../entities/employee');
const Salary = require('../entities/salary');
const ComplianceSettings = require('../entities/complianceSettings');

const LOCKED_STATUSES = ['PAID', 'APPROVED', 'COMPLETED'];
const OLD_TAX_REGIME = 'Old Tax Regime';

// The employee's own regime when set, otherwise the company default from Compliance
// Settings. otherConfigurations.tdsRegime is kept in sync by the Basic Information edit,
// but employees whose regime was set another way (e.g. when added) only have
// employeeInformation.taxRegime — the value the Basic Information tab shows — so that's
// checked too before falling back to the company default.
const resolveEmployeeTaxRegime = (employee, complianceSettings) =>
  employee?.otherConfigurations?.tdsRegime ||
  employee?.employeeInformation?.taxRegime ||
  complianceSettings?.tds?.taxRegime ||
  'New Tax Regime';

const isOldTaxRegimeEmployee = async (corporateUserID, employeeId) => {
  const [employee, complianceSettings] = await Promise.all([
    Employee.findOne({ _id: employeeId, corporateUser: corporateUserID })
      .select('otherConfigurations.tdsRegime employeeInformation.taxRegime')
      .lean(),
    ComplianceSettings.findOne({ corporateUser: corporateUserID }).select('tds.taxRegime').lean(),
  ]);
  if (!employee) return null;
  return resolveEmployeeTaxRegime(employee, complianceSettings) === OLD_TAX_REGIME;
};

// Mongo filters for "period on/after (month, year)" and "period strictly before".
const onOrAfter = (month, year) => ({ $or: [{ year: { $gt: year } }, { year, month: { $gte: month } }] });
const before = (month, year) => ({ $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }] });

const isFutureApplying = entry => entry.applyToFutureMonths !== false;
const periodKey = (month, year) => year * 12 + month;

// The entry in force for a payroll month, from an employee's full list of entries: an
// entry for that exact month (either kind) wins; otherwise the latest earlier
// "all future months" entry. "This month only" entries never carry forward.
const pickOverrideForMonth = (entries, month, year) => {
  const target = periodKey(month, year);
  const exact = entries.find(e => periodKey(e.month, e.year) === target);
  if (exact) return exact;
  return entries
    .filter(e => isFutureApplying(e) && periodKey(e.month, e.year) < target)
    .sort((a, b) => periodKey(b.month, b.year) - periodKey(a.month, a.year))[0] || null;
};

const findTdsOverrideForMonth = async ({ corporateUserID, employeeId, month, year }) => {
  const scope = { corporateUser: corporateUserID, employee: new ObjectId(employeeId) };
  const exact = await TdsOverride.findOne({ ...scope, month: Number(month), year: Number(year) }).lean();
  if (exact) return exact;
  return TdsOverride.findOne({
    ...scope,
    applyToFutureMonths: { $ne: false },
    ...before(Number(month), Number(year)),
  })
    .sort({ year: -1, month: -1 })
    .lean();
};

// The manual TDS entry to apply for this employee and month, or null when the tax
// engine's figure should stand (New Tax Regime employee, or nothing entered that
// applies to the month).
exports.resolveManualTds = async ({ corporateUserID, employeeId, month, year }) => {
  const isOld = await isOldTaxRegimeEmployee(corporateUserID, employeeId);
  if (!isOld) return null;
  return findTdsOverrideForMonth({ corporateUserID, employeeId, month, year });
};

exports.isOldTaxRegimeEmployee = isOldTaxRegimeEmployee;

// Saves an HR-entered TDS amount for (month, year) — for that month only, or for it and
// every later month until the next "all future months" entry — then brings every
// not-yet-approved Salary record from that month onward in line, since those records are
// only recomputed when payroll is processed again and the Salary Profile / payout read
// them as stored. A month no entry applies to any more goes back to the tax engine's own
// figure, which the record keeps in taxInformation.tdsMonthly.
exports.setTdsOverride = async ({ corporateUserID, employeeId, month, year, amount, applyToFutureMonths = true }) => {
  const numMonth = Number(month);
  const numYear = Number(year);
  const roundedAmount = Math.round(Number(amount));

  const isOld = await isOldTaxRegimeEmployee(corporateUserID, employeeId);
  if (isOld === null) return { success: false, message: 'Employee not found' };
  if (!isOld) {
    return { success: false, message: 'TDS can only be edited for employees on the Old Tax Regime' };
  }

  const employeeObjectId = new ObjectId(employeeId);
  const scope = { corporateUser: corporateUserID, employee: employeeObjectId };
  const targetSalary = await Salary.findOne({ ...scope, month: numMonth, year: numYear })
    .select('paymentStatus')
    .lean();
  if (targetSalary && LOCKED_STATUSES.includes(targetSalary.paymentStatus)) {
    return { success: false, message: 'Payroll for this month is already approved or paid, so its TDS can no longer be changed' };
  }

  await TdsOverride.findOneAndUpdate(
    { ...scope, month: numMonth, year: numYear },
    { $set: { amount: roundedAmount, applyToFutureMonths: Boolean(applyToFutureMonths) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const [entries, affectedSalaries] = await Promise.all([
    TdsOverride.find(scope).lean(),
    Salary.find({ ...scope, paymentStatus: { $nin: LOCKED_STATUSES }, ...onOrAfter(numMonth, numYear) })
      .select('month year salaryInformation.tdsAmount salaryInformation.tdsSource salaryInformation.taxInformation.tdsMonthly totalPayable')
      .lean(),
  ]);

  await Promise.all(
    affectedSalaries.map(salary => {
      const si = salary.salaryInformation || {};
      const entry = pickOverrideForMonth(entries, salary.month, salary.year);
      const nextTds = entry ? entry.amount : Math.round(Number(si.taxInformation?.tdsMonthly) || 0);
      const nextSource = entry ? 'MANUAL' : 'CALCULATED';
      const previousTds = Number(si.tdsAmount) || 0;
      if (previousTds === nextTds && (si.tdsSource || 'CALCULATED') === nextSource) return null;
      return Salary.updateOne(
        { _id: salary._id, paymentStatus: { $nin: LOCKED_STATUSES } },
        {
          $set: { 'salaryInformation.tdsAmount': nextTds, 'salaryInformation.tdsSource': nextSource },
          $inc: { totalPayable: previousTds - nextTds },
        }
      );
    })
  );

  return {
    success: true,
    message: 'TDS updated successfully',
    data: { month: numMonth, year: numYear, amount: roundedAmount, applyToFutureMonths: Boolean(applyToFutureMonths) },
  };
};

// For screens that aren't tied to a processed month (Salary Structure tab): whether the
// employee is on the Old Tax Regime (so HR can enter TDS) and the amount in force for the
// given month, if any.
exports.getTdsOverrideInfo = async ({ corporateUserID, employeeId, month, year }) => {
  const isOld = await isOldTaxRegimeEmployee(corporateUserID, employeeId);
  if (isOld === null) return { success: false, message: 'Employee not found' };
  const override = isOld ? await findTdsOverrideForMonth({ corporateUserID, employeeId, month, year }) : null;
  return {
    success: true,
    data: {
      isOldRegime: isOld,
      amount: override ? override.amount : null,
      effectiveFrom: override ? { month: override.month, year: override.year } : null,
      applyToFutureMonths: override ? isFutureApplying(override) : null,
    },
  };
};

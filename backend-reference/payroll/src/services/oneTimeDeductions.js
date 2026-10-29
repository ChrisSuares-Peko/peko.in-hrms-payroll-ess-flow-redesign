const Salary = require('../models/entities/salary');
const ErrorResponse = require('../utils/error-response');
const { processEmpSalary } = require('./salary');
const { getPayrollCycleContext } = require('./processSalary');

// Paid (or being paid out) — the month's pay is final, so its deductions cannot change.
const LOCKED_STATUSES = ['PAID', 'INITIATED', 'COMPLETED'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const findMonthSalary = ({ corporateUserID, employeeId, month, year }) =>
  Salary.findOne({ corporateUser: corporateUserID, employee: employeeId, month: Number(month), year: Number(year) })
    .select('paymentStatus')
    .lean();

exports.assertDeductionMonthOpen = async ({ corporateUserID, employeeId, month, year }) => {
  const salary = await findMonthSalary({ corporateUserID, employeeId, month, year });
  if (salary && LOCKED_STATUSES.includes(String(salary.paymentStatus).toUpperCase())) {
    throw new ErrorResponse(
      `${MONTH_NAMES[Number(month) - 1]} ${year} is already paid; deductions for a paid month cannot change`,
      400
    );
  }
  return salary;
};

// Re-runs payroll for this one employee and month so the saved net, Salary Details, Run
// Payroll and the payout reflect the change straight away. An APPROVED (not yet paid)
// salary is recalculated too and stays APPROVED.
exports.recalculateEmployeeMonth = async ({ corporateUserID, employeeId, month, year }) => {
  let context;
  try {
    context = await getPayrollCycleContext({
      corporateUserId: corporateUserID, month: Number(month), year: Number(year), ensureSalaryRows: false,
    });
  } catch (error) {
    // No payroll cycle for this month yet (e.g. before payroll starts) — nothing to
    // recalculate; the deduction applies when the month's salaries are generated.
    return;
  }
  const salary = await findMonthSalary({ corporateUserID, employeeId, month, year });
  const result = await processEmpSalary({
    month: Number(month),
    year: Number(year),
    corporateUserID,
    cycleStart: context.cycleStart,
    cycleEnd: context.cycleEnd,
    payrollStartsFrom: context.payrollStartsFrom,
    salaryCycleDay: context.salaryCycleDay,
    employeeId,
    recomputeApprovedEmployeeIds: salary?.paymentStatus === 'APPROVED' ? [String(employeeId)] : [],
  });
  if (!result.status) throw new ErrorResponse(result.message || 'Failed to recalculate salary', 400);
};

// The month a deduction belongs to — legacy rows predate month/year and only have a date.
exports.deductionMonthOf = (deduction) => {
  if (deduction.month && deduction.year) return { month: deduction.month, year: deduction.year };
  const date = new Date(deduction.deductionDate);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
};

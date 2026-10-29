const asyncHandler = require("../middleware/async");
const { createDeduction, findAllDeductionWthCount, findDuplicateDeduction, updateDeduction, deleteDeduction } = require("../models/use-cases/deductions");
const { calculateLeaveDeduction, checkDeductionAmountWithSalary, calculateOtherDeduction } = require("../services/deductions");
const { calculateSalaryCycle } = require("../services/salary");
const ErrorResponse = require("../utils/error-response");
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody } = require("../utils/tenantScope");
const { assertDeductionMonthOpen, recalculateEmployeeMonth, deductionMonthOf } = require("../services/oneTimeDeductions");

const {
    verifyEffectiveDateForCompensationComponents,
  } = require("../services/commonServices");

exports.createDeduction = asyncHandler(async (req, res, next) => {

    const employeeId = req.params.employeeId;
    const corporateUserID = req.user._id;
    const body = sanitizeBody(req.body, ['corporateUserID', 'employeeId'])

    const checkConditions = await checkSalaryDate(body.deductionDate, employeeId);


    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }
    const isVerified=await verifyEffectiveDateForCompensationComponents(
        corporateUserID,
        employeeId,
        body.deductionDate
      );
      
      if (!isVerified.status) {
        return next(new ErrorResponse(isVerified.message, 400));
      }
    // const checkDeduction = await checkDeductionAmount(employeeId, body?.deductionDate, body?.deductionAmount, corporateUserID)

    // if (!checkDeduction) {
    //     return next(new ErrorResponse('Total deduction amount is grater than the basic salary.', 400));
    // }

    //check weather this amount of deduction is available in this salary cycle, to avoid negative salary
    let { status, message } = await checkDeductionAmountWithSalary(body, corporateUserID, employeeId)
    if (!status) throw new ErrorResponse(message, 400)

    const isDuplicate = await findDuplicateDeduction({ ...body, corporateUserID, employeeId })
    if (isDuplicate) throw new ErrorResponse('Duplicate entry', 400)

    const result = await createDeduction({ ...body, corporateUserID, employeeId });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deduction created successfully',
        data: result
    });
})

// Edit Deduction — same type list, note and whole-rupee amount as Add; the deduction
// stays in the month it was added for. Refused once that month is paid.
exports.updateOneDeduction = asyncHandler(async (req, res) => {

    const employeeId = req.params.employeeId;
    const deductionId = req.params.deductionId;
    const corporateUserID = req.user._id;
    // Only these three fields are read — the body is never spread into the update, so a
    // caller cannot reassign corporateUser/employee through it.
    const { deductionFor, note, amount } = req.body;

    const existing = await findDuplicateDeduction({ corporateUserID, employeeId, _id: deductionId });
    if (!existing) throw new ErrorResponse('Deduction not found', 404);

    const { month, year } = deductionMonthOf(existing);
    await assertDeductionMonthOpen({ corporateUserID, employeeId, month, year });

    const { status, updated, message } = await updateDeduction(deductionId, {
        corporateUserID,
        employeeId,
        deductionType: deductionFor,
        deductionFor,
        note: note || '',
        deductionAmount: amount,
    });
    if (!status) throw new ErrorResponse(message, 400);

    await recalculateEmployeeMonth({ corporateUserID, employeeId, month, year });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deduction updated successfully',
        data: updated
    });
})

exports.deleteOneDeduction = asyncHandler(async (req, res) => {

    const employeeId = req.params.employeeId;
    const deductionId = req.params.deductionId;
    const corporateUserID = req.user._id;

    const existing = await findDuplicateDeduction({ corporateUserID, employeeId, _id: deductionId });
    if (!existing) throw new ErrorResponse('Deduction not found', 404);
    const { month, year } = deductionMonthOf(existing);
    await assertDeductionMonthOpen({ corporateUserID, employeeId, month, year });

    const { status, deletedDeduction, message } = await deleteDeduction(deductionId, corporateUserID, employeeId)
    if (!status) throw new ErrorResponse(message, 400)

    await recalculateEmployeeMonth({ corporateUserID, employeeId, month, year });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deduction deleted successfully',
        data: deletedDeduction
    });
})

exports.findOneDeduction = asyncHandler(async (req, res) => {

    const employeeId = req.params.employeeId;
    const deductionId = req.params.deductionId;
    const corporateUserID = req.user._id;

    const deduction = await findDuplicateDeduction({ corporateUserID, employeeId, _id: deductionId })
    if (!deduction) throw new ErrorResponse('Deduction not found', 404)

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deduction fetched successfully',
        data: deduction
    });
})

// "Add Deduction" on the Employee Salary page — a typed one-time recovery from pay the
// employee has already earned (Code on Wages s.18(2)), for the month selected on Salary
// Details. Not Loss of Pay (unpaid days have their own sheet) and not a recurring
// component (HR Settings › Salary Components › Deductions). The payroll run takes it off
// net pay after PF/ESI/TDS, within the 50% limit, carrying any balance to the next month.
exports.createDeductionDirect = asyncHandler(async (req, res) => {
    const employeeId = req.params.employeeId;
    const corporateUserID = req.user._id;
    const { deductionFor, note, amount, month, year } = req.body;

    await assertDeductionMonthOpen({ corporateUserID, employeeId, month, year });

    const result = await createDeduction({
        corporateUserID,
        employeeId,
        deductionFor,
        deductionType: deductionFor,
        note: note || '',
        deductionAmount: amount,
        month,
        year,
        // Kept for the cycle-scoped legacy readers; the month/year above is authoritative.
        deductionDate: new Date(Date.UTC(year, month - 1, 1)),
    });

    await recalculateEmployeeMonth({ corporateUserID, employeeId, month, year });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deduction added successfully',
        data: result
    });
});

exports.findAllDeductions = asyncHandler(async (req, res) => {

    const employeeId = req.params.employeeId;
    const corporateUserID = req.user._id;

    const { status, cycleStart, cycleEnd, message, month, year } = await calculateSalaryCycle(req);
    if (!status) throw new ErrorResponse(message, 400)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchParams = {
        corporateUserID,
        employeeId,
        page,
        limit,
        skip,
        cycleStart,
        cycleEnd,
        month,
        year
    }

    //before fetching other deduction from db we should show the leave related total deduction for the particular period
    const { status: status2, leaveDeductions, message: message2 } = await calculateLeaveDeduction({
        employeeId,
        corporateUserID,
        cycleStart,
        cycleEnd,
        month, year
    })
    if (!status2) throw new ErrorResponse(message2, 400)

    // we should show the deduction because of if employee join after salary cycle start
    const { status: status3, otherDeductions, message: message3 } = await calculateOtherDeduction({
        employeeId,
        corporateUserID,
        cycleStart,
        cycleEnd,
        month, year
    })
    if (!status3) throw new ErrorResponse(message3, 400)


    const { totalCount, deductions } = await findAllDeductionWthCount(searchParams);
    let mergedList = page == 1 ? [...leaveDeductions,...otherDeductions, ...deductions] : deductions

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Deductions fetched successfully',
        data: { totalCount: totalCount + leaveDeductions.length, deductions: mergedList }
    });
})

const asyncHandler = require("../middleware/async");
const ErrorResponse = require('../utils/error-response');
const { createOverTimeData, getAllOverTimeData, deleteOverTime, editOverTime, fetchAllOverTimeData } = require("../models/use-cases/overTime");
const Overtime = require("../models/entities/overTime");
const Employee = require("../models/entities/employee");
const { calculateOvertimeAmount } = require("../services/overtime");
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");
const {
    verifyEffectiveDateForCompensationComponents,
} = require("../services/commonServices");
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { humanReadableDate } = require("../utils/dateUtils");
const { overtimeStatusUpdate } = require("../utils/email/emailTemplates/overtime");

const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;
const EMPLOYEE_OVERTIME_PATH = "/employee/attendance?tab=2";

// Notify the employee when the corporate approves or rejects their overtime request.
// Best-effort: a mail failure must never fail the status update.
async function emailOvertimeStatus({ req, corporateUserId, employeeId, overTimeDate, extraHours, status, logTraceId }) {
    try {
        const employee = await Employee.findOne(
            { _id: employeeId, corporateUser: corporateUserId },
            'personalInformation.fullName personalInformation.email'
        ).lean();
        const to = employee?.personalInformation?.email;
        if (!to) {
            customLog(logTraceId, 'info', { message: 'No email found for employee; skipped overtime status email', employeeId });
            return;
        }

        const hrSettings = await findOneHrSettings(corporateUserId);
        const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
        const partnerBranding = await fetchPartnerBranding(req);
        const isPartner = !!req.user?.registeredBy;
        // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only the
        // website/link falls back to the corporate's own saved website when there's no
        // genuine reseller partner registration, instead of Peko's own.
        const branding = {
            ...partnerBranding,
            website: isPartner ? partnerBranding?.website : (hrSettings?.corporateUser?.website || partnerBranding?.website),
        };
        const employeeName = employee?.personalInformation?.fullName;
        const overtimeDate = overTimeDate ? humanReadableDate(overTimeDate) : null;
        const viewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_OVERTIME_PATH}` : '';

        const resolvedEmail = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.OVERTIME_STATUS_UPDATE,
            variables: {
                employeeName: employeeName || 'Employee',
                organizationName: companyName || 'Peko',
                requestStatus: status === 'approved' ? 'approved' : 'rejected',
                overtimeDateLine: overtimeDate ? ` for ${overtimeDate}` : '',
                detailLinesHtml: `Hours requested: ${extraHours ?? ''}`,
                ctaUrl: viewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: `Overtime Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
            fallbackHtml: overtimeStatusUpdate({
                companyName,
                employeeName,
                overtimeDate,
                overtimeHours: extraHours,
                status,
                viewUrl,
            }, branding),
            partnerId: req.user?.registeredBy || null,
        });

        const response = await emailer.email(to, resolvedEmail.subject, resolvedEmail.html);
        if (!response?.status) {
            customLog(logTraceId, 'error', { message: 'Failed to send overtime status email', error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, 'error', { message: 'Failed to send overtime status email', error: error?.message });
    }
}


exports.createOvertime = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const overtimeData = sanitizeBody(req.body);
    const { overTimeDate } = overtimeData
    if (new Date(overTimeDate) >= new Date()) {
        return next(new ErrorResponse('You can add over time only for past days', 400));
    }

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    const params = {
        corporateUserID,
        employeeId,
        overtimeData
    }

    const isVerified = await verifyEffectiveDateForCompensationComponents(
        corporateUserID,
        employeeId,
        req?.body?.overTimeDate
    );

    if (!isVerified.status) {
        return next(new ErrorResponse(isVerified.message, 400));
    }

    const checkConditions = await checkSalaryDate(req?.body?.overTimeDate, req?.params?.id);

    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }

    const result = await createOverTimeData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while creating overtime data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'OverTime data created successfully',
        data: result
    });

})

exports.getAllOverTime = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;
    const month = req.query.month
    const year = req.query.year

    const params = {
        corporateUserID,
        employeeId,
        page,
        limit,
        searchText,
        skip,
        month,
        year
    }

    const result = await getAllOverTimeData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while generating overtime data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'OverTime data fetched successfully',
        data: result
    });

})

exports.fetchAllOverTime = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const validStatuses = ['requestedByEmployee', 'approved', 'rejected', 'cancelledByEmployee'];
    if (status && !validStatuses.includes(status)) {
        return next(new ErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const params = {
        corporateUserID,
        page,
        limit,
        searchText,
        skip,
        status,
    }

    const result = await fetchAllOverTimeData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while generating overtime data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'OverTime data fetched successfully',
        data: result
    });

})

exports.fetchSingleOvertimeUsingId = asyncHandler(async (req, res, next) => {

    const { overtimeId } = req.params;
    const overtimeData = await Overtime.findOne({ _id: overtimeId, corporateUser: req.user._id })
    if (!overtimeData) {
        return next(new ErrorResponse('something went wrong while fetching overtime data', 400));
    } else {
        return res.status(201).json({
            status: true,
            data: overtimeData,
            message: 'overtime data fetched successfully',
            responseCode: '000'
        })
    }

})

exports.deleteAnOverTime = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const overTimeId = req.params.id;

    const foundOvertime = await Overtime.findOne({
        _id: overTimeId,
        corporateUser: corporateUserID
    });
    if (!foundOvertime) {
        return next(new ErrorResponse('overtime dataa not found or unauthorized to delete', 400));
    }

    if (foundOvertime.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot delete. overtime is already paid.', 400));
    }

    const params = {
        corporateUserID,
        overTimeId
    }

    const result = await deleteOverTime(params);

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'OverTime data deleted successfully',
        data: result
    });

})

exports.editAnOverTime = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const overTimeId = req.params.id;
    const editData = sanitizeBody(req.body);
    const { overTimeDate } = editData
    if (new Date(overTimeDate) >= new Date()) {
        return next(new ErrorResponse('You can add over time only for past days', 400));
    }

    const foundOvertime = await Overtime.findOne({
        _id: overTimeId,
        corporateUser: corporateUserID
    });

    if (!foundOvertime) {
        return next(new ErrorResponse('overtime data not found or unauthorized to edit', 400));
    }

    // Use the record's own employee — the edit payload (e.g. from the Timesheet
    // Overtime tab) never re-sends employeeId since it can't change on edit.
    const checkConditions = await checkSalaryDate(editData?.overTimeDate, foundOvertime.employee);

    if (!checkConditions?.status) {
        return next(new ErrorResponse(checkConditions?.message || 'The date that you have provided is not valid.', 400));
    }

    if (foundOvertime.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot edit. overtime is already paid.', 400));
    }

    const params = {
        corporateUserID,
        overTimeId,
        editData
    }

    if (foundOvertime) {
        const result = await editOverTime(params);

        if (result.ErrorResponse) {
            return next(new ErrorResponse(result.ErrorResponse, 400));
        }

        // Only mail the employee when this edit is what decides the status, so
        // unrelated edits (date, hours, rate) do not trigger a status email.
        const newStatus = editData?.status;
        if ((newStatus === 'approved' || newStatus === 'rejected') && foundOvertime.status !== newStatus) {
            await emailOvertimeStatus({
                req,
                corporateUserId: corporateUserID,
                employeeId: foundOvertime.employee,
                overTimeDate: overTimeDate || foundOvertime.overTimeDate,
                extraHours: editData?.extraHours ?? foundOvertime.extraHours,
                status: newStatus,
                logTraceId: req?.LogTraceId,
            });
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'OverTime data updated successfully',
            data: result
        });
    }

})

exports.calculateOverTimeAmount = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    const overtimeHours = req.body.extraHours;
    const overtimeRate = req.body.overtimeRate;

    const params = {
        corporateUserID,
        employeeId,
        overtimeHours,
        overtimeRate
    }

    const overtimeData = await calculateOvertimeAmount(params)

    if (overtimeData?.status === false) {
        return res.status(400).json(overtimeData)
    } else {
        return res.status(201).json(overtimeData)
    }

    // return res.status(201).json({
    //     status: true,
    //     responseCode: '000',
    //     message: 'OverTime amount calculated successfully',
    //     data: {overtimeAmount : overtimePay, totalWorkingHours: workingHoursPerDay}
    // });

})

// PATCH /overtime/:overtimeId/status
// Corporate side: approve or reject an employee overtime request.
// Body: status (approved | rejected), notes (optional)
exports.updateOvertimeStatus = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { overtimeId } = req.params;
    const { status, overTimeRate, notes } = req.body;

    const validStatuses = ['approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: "status must be 'approved' or 'rejected'" });
    }

    const record = await Overtime.findOne({ _id: overtimeId, corporateUser });
    if (!record) {
        return res.status(404).json({ status: false, message: 'Overtime record not found' });
    }

    if (record.status !== 'requestedByEmployee') {
        return res.status(400).json({ status: false, message: `Cannot update an overtime request that is already '${record.status}'` });
    }

    if (status === 'approved') {
        const rateToUse = overTimeRate || record.overTimeRate;
        if (!rateToUse) {
            return res.status(400).json({ status: false, message: 'Unable to approve the overtime request. Please set the OT rate before approving.' });
        }

        const calculated = await calculateOvertimeAmount({
            corporateUserID: corporateUser,
            employeeId: record.employee.toString(),
            overtimeHours: record.extraHours,
            overtimeRate: rateToUse,
        });

        if (!calculated.status) {
            return res.status(400).json({ status: false, message: calculated.message });
        }

        if (!calculated.data.overtimeAmount || calculated.data.overtimeAmount === 0) {
            return res.status(400).json({ status: false, message: 'Cannot approve: overtime amount calculated as 0. Check employee basic salary and work schedule.' });
        }

        record.overTimeRate = rateToUse;
        record.hourlyRate = calculated.data.hourlyRate;
        record.totalWorkingHours = calculated.data.totalWorkingHours;
        record.overTimeAmount = calculated.data.overtimeAmount;
    }

    record.status = status;
    if (notes !== undefined) record.notes = notes;
    await record.save();

    const employee = await Employee.findOne(
        { _id: record.employee, corporateUser },
        'personalInformation.fullName personalInformation.email profileImage employeeInformation'
    ).lean();

    await emailOvertimeStatus({
        req,
        corporateUserId: corporateUser,
        employeeId: record.employee,
        overTimeDate: record.overTimeDate,
        extraHours: record.extraHours,
        status,
        logTraceId: req?.LogTraceId,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `Overtime request ${status} successfully`,
        data: {
            _id: record._id,
            employee: {
                _id: record.employee,
                fullName: employee?.personalInformation?.fullName ?? null,
                email: employee?.personalInformation?.email ?? null,
                profileImage: employee?.profileImage ?? null,
                designation: employee?.employeeInformation?.designation ?? null,
            },
            overTimeDate: record.overTimeDate,
            extraHours: record.extraHours,
            overTimeRate: record.overTimeRate,
            hourlyRate: record.hourlyRate,
            overTimeAmount: record.overTimeAmount,
            status: record.status,
            notes: record.notes ?? null,
        },
    });
});

// PATCH /overtime/:overtimeId/rate
// HR: update overtime rate only; recalculates hourly rate and overtime amount
exports.updateOvertimeRate = asyncHandler(async (req, res, next) => {
    const corporateUser = req.user._id.toString();
    const { overtimeId } = req.params;
    const { overTimeRate, notes } = req.body;

    const record = await Overtime.findOne({ _id: overtimeId, corporateUser });
    if (!record) {
        return next(new ErrorResponse('Overtime record not found', 404));
    }

    if (record.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot edit. Overtime is already paid.', 400));
    }

    const calculated = await calculateOvertimeAmount({
        corporateUserID: corporateUser,
        employeeId: record.employee.toString(),
        overtimeHours: record.extraHours,
        overtimeRate: overTimeRate,
    });

    if (!calculated.status) {
        return next(new ErrorResponse(calculated.message, 400));
    }

    record.overTimeRate = overTimeRate;
    record.hourlyRate = calculated.data.hourlyRate;
    record.totalWorkingHours = calculated.data.totalWorkingHours;
    record.overTimeAmount = calculated.data.overtimeAmount;
    if (notes !== undefined) record.notes = notes;
    await record.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Overtime rate updated successfully',
        data: {
            _id: record._id,
            overTimeRate: record.overTimeRate,
            hourlyRate: record.hourlyRate,
            totalWorkingHours: record.totalWorkingHours,
            overTimeAmount: record.overTimeAmount,
            notes: record.notes ?? null,
        },
    });
});
const asyncHandler = require("../middleware/async");
const { processSalary, calculateSalaryCycleBasedOnMonth, emailPayslip, downloadPayslip, extractStatementParams, fetchSalaryByEmployeeId, calculateEmpSalaryCycleBasedOnMonth, generateSalaryHistoryReportPdf } = require('../services/salary');
const { getSalaryDetails, getAllSalariesByEmployeeIdAndCorporateUserId, approveSalary, getSalaryInfo, getSalaryCycleDay,checkSalaryDetailsForEmployee, empApproveSalary, calculateWorkingDays,salaryProfileEmp,salaryProfileEmpV2,payrollHistory,empMonthlyApproveSalary,salaryHistoryList,salaryHistoryDetail,salaryHistoryDetailAll,getSalaryHistoryList, markSalaryAsPaid, revertSalaryToApproved } = require('../models/use-cases/salary');
// const{getUnbankedEmployees}=require("../models/use-cases/employee")
const { getExcelSalaryDetails } = require('../models/use-cases/salary')
const { setTdsOverride, getTdsOverrideInfo } = require('../models/use-cases/tdsOverride');
const Employee = require('../models/entities/employee');
const SalaryStructureVersion = require('../models/entities/salaryStructureVersion');
const async = require('async'); // Import the async library
const LeaveApplication = require('../models/entities/leaveApplication');
const HrSettings = require('../models/entities/hrSettings');
const { humanReadableDate } = require('../utils/dateUtils');
const { ensureSalaryRecords } = require('../services/salarySync');
// const { validateGeneratePaySlip } = require('../utils/apiValidation');
const ErrorResponse = require('../utils/error-response');
const { generateExcelBufferAndType } = require('../utils/documentToBuffer');
const { checkSalaryDate } = require('../utils/salaryDate');
const { isEmployeeOfCorporate } = require('../utils/tenantScope');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose
const { calculateTotalSalary } = require("../services/calculateTotalSalary")
const { calculateTotalAllowance } = require("../services/calculateTotalAllowance");
const Salary = require('../models/entities/salary');
const OrganizationSettings = require('../models/entities/organizationSettings');
const { escapeSearch } = require('../utils/escapeRegex');
const emailer = require('../utils/email/emailer');
const { customLog } = require('../utils/loggerHelper');
const { findOneHrSettings } = require('../models/use-cases/hrSettings');
const { fetchPartnerBranding } = require('../services/partnerDetailsResolver');
const { resolveDynamicEmail } = require('../services/emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { salaryApproved } = require('../utils/email/emailTemplates/salaryApproved');

const CORPORATE_SALARY_PATH = "/payroll/employees-salary";
const FRONTEND_BASE_URL_FOR_SALARY = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

// Confirm to the corporate/HR admin that a payroll cycle has been approved.
// Best-effort: a mail failure must never fail the approval.
async function emailSalaryApproved({ req, corporateUserId, month, year, logTraceId }) {
    try {
        const hrSettings = await findOneHrSettings(corporateUserId);
        const corporateUser = hrSettings?.corporateUser;
        if (!corporateUser || !corporateUser.email) return;

        const companyName = hrSettings?.companyProfile?.companyName || corporateUser?.companyName;
        const partnerBranding = await fetchPartnerBranding(req);
        const isPartner = !!req.user?.registeredBy;
        // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only the
        // website/link falls back to the corporate's own saved website when there's no
        // genuine reseller partner registration, instead of Peko's own.
        const branding = {
            ...partnerBranding,
            website: isPartner ? partnerBranding?.website : (corporateUser?.website || partnerBranding?.website),
        };
        const period = month && year
            ? new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1)) + ` ${year}`
            : null;
        const viewUrl = FRONTEND_BASE_URL_FOR_SALARY ? `${FRONTEND_BASE_URL_FOR_SALARY}${CORPORATE_SALARY_PATH}` : '';

        const resolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.SALARY_APPROVED,
            variables: {
                adminName: companyName || 'Team',
                forPeriod: period ? ` for ${period}` : '',
                branding: companyName || 'Peko',
                ctaUrl: viewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: period ? `Payroll for ${period} has been approved` : 'Your payroll has been approved',
            fallbackHtml: salaryApproved({ adminName: companyName, period, viewUrl }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(corporateUser.email, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send salary-approved email", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to send salary-approved email", error: error?.message });
    }
}


exports.getAllSalaryDetails = asyncHandler(async (req, res, next) => {

    let { corporateUserID, currentDate, searchText, month, year } = extractStatementParams(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    //# 01
    let { payrollSettings: { salaryCycleDay, payrollStartsFrom } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });

    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    }

    //# 02
    let { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)

    console.log({ cycleStart, cycleEnd, newDate: new Date() })

    if (cycleStart >= currentDate) {
        //return next(new ErrorResponse('Salary details not available for this date range', 400));
    }

    //- Check if cycleStart is less than payrollStartsFrom
    if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
        return next(new ErrorResponse('There are no employees for this month', 400));
    } else if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
        // cycleStart = payrollStartsFrom
    }

    // const unbankedEmployees = await unbankedEmployees(corporateUserID)
    //     if(unbankedEmployees){
    //         return next(new ErrorResponse('Please add bank details for all employees ', 400)); 
    //     }



    //# 03 - Process salary for the required period ans save to 'salary table'
    if (!searchText && page == 1) { //process salary only if the search text is empty and first page
        let { status, message } = await processSalary({ month, year, corporateUserID, cycleStart, cycleEnd, payrollStartsFrom })
        if (!status) return next(new ErrorResponse(message, 400));
    }
    if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
        //cycleStart = payrollStartsFrom
    }
    //# 04 - Fetch created salary records form 'salary table'
    let salaryDetails = await getSalaryDetails({ page, limit, searchText, cycleStart, cycleEnd, corporateUserID })

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary details successfully fetched',
        data: salaryDetails
    });

})

exports.getAllSalaryDetailsByMonth = asyncHandler(async (req, res, next) => {

    let { corporateUserID, currentDate, month, year } = extractStatementParams(req);

    //need to find start and end date for this salary cycle based on day specified in hr setting
    let { payrollSettings: { salaryCycleDay, payrollStartsFrom } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });
    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    }
    let { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
    if (cycleStart >= currentDate) {
        //return next(new ErrorResponse('Salary details not available for this date range', 400));
    }
    //- Check if cycleStart is less than payrollStartsFrom
    if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
        return next(new ErrorResponse('Cycle start date is earlier than payroll start date', 400));
    }

    let salaryDetails = await getExcelSalaryDetails({ cycleStart, cycleEnd, corporateUserID })
    let excelData = [];
    salaryDetails.forEach(function (employee) {
        if (employee.employee) {
            excelData.push({
                "Employee Name": employee?.employee?.fullName ?? "N/A",
                "Employee Id": employee?.employee?.employeeInformation?.employeeId ?? "N/A",
                "Designation": employee?.employee?.employeeInformation?.designation ?? "N/A",
                "Department": employee?.employee?.employeeInformation?.department?.departmentName ?? "N/A",
                "Job Type": employee?.employee?.employeeInformation?.jobType ?? 'N/A',
                "Salary cycle start Date": humanReadableDate(employee?.salaryCycleStart) ?? "N/A",
                "Salary cycle end Date": humanReadableDate(employee?.salaryCycleEnd) ?? "N/A",
                "Basic Salary": employee?.salaryInformation?.basicPay ?? "N/A",
                "Total Allowance": calculateTotalAllowance(employee.salaryInformation) ?? "N/A",
                "Total Salary": calculateTotalSalary(employee.salaryInformation) ?? "N/A",
                "Salary Status": employee?.paymentStatus ?? "N/A"
            });
        }
    });

    generateExcelBufferAndType(excelData)
        .then(({ buffer, fileType }) => {
            // Now 'buffer' contains the Excel file in buffer form
            console.log('Excel buffer generated successfully.');
            console.log('File type:', fileType);
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: "Salary Details got successfully",
                data: { buffer, fileType },
            });
        })
        .catch(error => {
            console.error('Error generating Excel buffer and type:', error);
            next(error);
        });
})

exports.getProfile = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    let salaryId = req.params.id;

    let { status, data: employeeSalary, message } = await fetchSalaryByEmployeeId({ salaryId, corporateUserID })
    if (!status) {
        return next(new ErrorResponse(message || "Salary information not found", 400));
    }

    let employeeId = employeeSalary.employee
    const results = await async.parallel({
        employee: async () => {
            let employee = await Employee.findOne({
                _id: employeeId,
                corporateUser: req.user._id
            }).populate({
                path: 'employeeInformation.department',
                select: 'departmentName'
            });
            return employee;
        },
        leaveSummary: async () => {
            const leaveCounts = await LeaveApplication.aggregate([
                {
                    $match: {
                        employee: new ObjectId(employeeId),
                        corporateUser: corporateUserID
                    }
                },
                {
                    $group: {
                        _id: '$typeOfLeave',
                        leaveCount: { $sum: '$leaveCount' }
                    }
                },
                {
                    $project: {
                        leaveType: '$_id', // Rename _id to leaveType
                        leaveCount: 1,
                        _id: 0 // Exclude _id if you don't need it
                    }
                }
            ]);
            return leaveCounts;
        },
        salaryInfo: async () => {

            return employeeSalary;
        }
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary details successfully updated',
        data: results
    });
})

exports.allPayrollSlips = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    let employeeId = req.params.employeeId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const column = parseInt(req.query.column) || 0;
    const year = req.query.year;
    let order = req.query.order || 'DESC';
    order = order.toUpperCase() === 'DESC' ? -1 : 1;

    // A single year has at most 12 Salary docs for this employee, so page:1/limit:12
    // always fetches every real doc for the year regardless of what the caller asked
    // for — the scaffold-fill below (12 months, real docs merged in) then applies the
    // caller's own page/limit itself, so pagination behaves the same as before for any
    // consumer that doesn't care about the scaffold (e.g. year omitted).
    const fetchPage = year ? 1 : page;
    const fetchLimit = year ? 12 : limit;

    //based on the employeeId and corporateUserID fetch all salary collection
    let paySlips = await getAllSalariesByEmployeeIdAndCorporateUserId({ corporateUserID, employeeId, page: fetchPage, limit: fetchLimit, column, order, year })

    // Enriched, per-row Gross Earnings/Total Deductions/Paid On for the redesigned Payroll
    // Slip table — computed here rather than in the use-case itself so its own existing test
    // (which pins `rows` to the raw Salary docs) doesn't need to change.
    let rows = (paySlips.rows || []).map((salary) => {
        const si = salary.salaryInformation || {};
        const grossEarnings =
            (si.basicPay || 0) +
            (si.increamentAmount || 0) +
            (si.hraAmount || 0) +
            (si.daAmount || 0) +
            (si.other || 0) +
            (salary.totalBonus || 0) +
            (salary.totalIncentive || 0) +
            (salary.totalOvertime || 0) +
            (salary.totalReimbursement || 0) +
            (salary.totalArrears || 0);
        const totalDeductions = (si.deductionAmount || 0) + (salary.leaveDeduction || 0) + (si.tdsAmount || 0);

        return {
            id: salary._id,
            month: salary.month,
            year: salary.year,
            salaryCycleStart: salary.salaryCycleStart,
            paymentStatus: salary.paymentStatus,
            payingDate: salary.payingDate || null,
            grossEarnings,
            totalDeductions,
            netPaid: Number(salary.totalPayable) || 0,
            // Backdated-increment arrears included in this month's payout, if any — lets
            // the table flag "includes arrears" rather than silently folding it into
            // Gross Earnings with no indication of why the amount jumped.
            arrearsAmount: salary.totalArrears || 0,
            // Kept for any other consumer still reading the old field name.
            totalPayable: Number(salary.totalPayable) || 0,
        };
    });

    let count = paySlips.count;

    // Scaffold in a placeholder row for every month of the requested year that has no
    // Salary doc yet (payroll not run that far ahead, or a gap in the past) — the
    // Payroll Slip tab should show all 12 months, not just the ones that happen to have
    // a record. paymentStatus left unset so the existing frontend badge (paidOnBadge,
    // utils/salaryTable/data.tsx) renders it exactly like any other not-yet-run month —
    // "Pending", actions disabled — with no frontend changes needed for this to work.
    //
    // Rather than a flat ₹0 (which reads as "this employee earns nothing" instead of
    // "payroll hasn't run for this month yet"), project what they'd earn under their
    // CURRENT salary structure — the same engine (salaryProfileEmp) the Salary Profile
    // tab already uses to preview an unprocessed month, so the projected figure here can
    // never disagree with what that tab shows for the same month.
    if (year) {
        // Cap how far into the year we scaffold — a future month hasn't happened yet, so
        // there's nothing to project (or show) for it. The current year stops at the
        // current month; a fully-elapsed past year scaffolds all 12; a not-yet-started
        // future year scaffolds none.
        const now = new Date();
        const requestedYear = parseInt(year);
        const maxMonth =
            requestedYear < now.getFullYear() ? 12 :
            requestedYear > now.getFullYear() ? 0 :
            now.getMonth() + 1;

        // Never scaffold a month before the employee actually joined, or before the
        // organization's own "First payroll from" date (HR Settings > Payroll Cycle) —
        // neither has a salary structure to project against for that month, and nothing
        // real could ever have been paid for it. The floor is whichever of the two lands
        // later in the requested year.
        const monthFloorForYear = (date) => {
            if (!date) return 1;
            if (date.getFullYear() === requestedYear) return date.getMonth() + 1;
            return date.getFullYear() > requestedYear ? 13 : 1;
        };

        const employee = await Employee.findById(employeeId).select('employeeInformation.dateOfJoin').lean();
        const dateOfJoin = employee?.employeeInformation?.dateOfJoin ? new Date(employee.employeeInformation.dateOfJoin) : null;

        let payrollStartsFrom = null;
        try {
            const cycleInfo = await getSalaryCycleDay(corporateUserID);
            if (cycleInfo && cycleInfo.payrollStartsFrom) {
                payrollStartsFrom = new Date(cycleInfo.payrollStartsFrom);
            }
        } catch (e) {
            payrollStartsFrom = null;
        }

        const minMonth = Math.max(monthFloorForYear(dateOfJoin), monthFloorForYear(payrollStartsFrom));

        const byMonth = new Map(rows.map((row) => [row.month, row]));
        const missingMonths = [];
        for (let month = minMonth; month <= maxMonth; month += 1) {
            if (!byMonth.has(month)) missingMonths.push(month);
        }

        // Prefer cloning a REAL month's already-computed figures — Gross Earnings, Total
        // Deductions (including TDS, leave deductions, everything the actual payroll run
        // resolved), Net Paid — as the template for a gap month, rather than re-deriving
        // a structural-only estimate via salaryProfileEmp below. That estimate can't
        // include TDS (it's only ever computed by actually running payroll — see the "how
        // is this calculated" discussion), so it understates deductions relative to a
        // real month even when nothing about the employee's pay has changed.
        //
        // A Revise Salary that took effect between a gap month and a candidate real month
        // means they're on genuinely different structures — cloning across that boundary
        // would apply a salary the employee didn't have yet (or no longer has) for that
        // month. So for each gap month, pick the CLOSEST real month that sits on the same
        // side of every revision (there can be several real months on different sides of
        // a revision, e.g. an older unpaid month finally processed after a later month
        // already was) — never just "the latest real month overall", which would wrongly
        // skip over a same-structure real neighbour in favour of a farther one on a
        // different structure. Only a gap month with no eligible real month anywhere
        // falls back to the live per-month projection, which resolves the correct
        // historical/live structure itself via SalaryStructureVersion.
        const revisions = await SalaryStructureVersion.find({ employee: employeeId }).select('effectiveFrom').lean();
        const revisionMonthsInYear = new Set(
            revisions
                .map((r) => new Date(r.effectiveFrom))
                .filter((d) => d.getFullYear() === requestedYear)
                .map((d) => d.getMonth() + 1)
        );
        const hasRevisionBetween = (monthA, monthB) => {
            const low = Math.min(monthA, monthB);
            const high = Math.max(monthA, monthB);
            for (let m = low + 1; m <= high; m += 1) {
                if (revisionMonthsInYear.has(m)) return true;
            }
            return false;
        };

        const templateByMonth = new Map();
        missingMonths.forEach((month) => {
            const sameStructureRealRows = rows.filter((row) => !hasRevisionBetween(month, row.month));
            if (!sameStructureRealRows.length) return;
            const nearest = sameStructureRealRows.reduce((closest, row) =>
                Math.abs(row.month - month) < Math.abs(closest.month - month) ? row : closest
            );
            templateByMonth.set(month, nearest);
        });

        const monthsNeedingProjection = missingMonths.filter((month) => !templateByMonth.has(month));

        const projections = await Promise.all(
            monthsNeedingProjection.map((month) =>
                salaryProfileEmp({ corporateUserID, employeeId, month, year: requestedYear })
            )
        );
        const projectionByMonth = new Map(monthsNeedingProjection.map((month, idx) => [month, projections[idx]]));

        missingMonths.forEach((month) => {
            const template = templateByMonth.get(month);
            const totals = template
                ? { totalEarnings: template.grossEarnings, totalDeductions: template.totalDeductions, netSalary: template.netPaid }
                : (projectionByMonth.get(month)?.status ? projectionByMonth.get(month).totals : null);
            byMonth.set(month, {
                id: null,
                month,
                year: requestedYear,
                salaryCycleStart: null,
                paymentStatus: null,
                payingDate: null,
                grossEarnings: totals?.totalEarnings || 0,
                totalDeductions: totals?.totalDeductions || 0,
                netPaid: totals?.netSalary || 0,
                arrearsAmount: 0,
                totalPayable: totals?.netSalary || 0,
            });
        });

        const scaffolded = [];
        for (let month = minMonth; month <= maxMonth; month += 1) {
            const row = byMonth.get(month);
            if (row) scaffolded.push(row);
        }
        scaffolded.sort((a, b) => (order === -1 ? b.month - a.month : a.month - b.month));

        count = scaffolded.length;
        const skip = (page - 1) * limit;
        rows = scaffolded.slice(skip, skip + limit);
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Pay slips get successfully ',
        data: { ...paySlips, count, rows }
    });
})

exports.payrollSlipsEmailed = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    let salaryId = req.params.salaryId
    let companyInfo = {
        logo: req.user.logo,
        companyName: req.user.companyName,
        email: req.user.email,
        website: req.user.website,
        address: `${req.user.city}  ${req.user.country}`
    }
    let { status, message, data } = await emailPayslip(req, { corporateUserID, salaryId, companyInfo })
    if (!status) {
        return next(new ErrorResponse(message, 400));
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Pay slips emailed successfully ',
        data: data
    });
})

exports.payrollSlipsDownload = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    let employeeId = req.params.salaryId
    let month = req.query.month
    let year = req.query.year
    let sendEmail  = req.query.sendEmail 
    let companyInfo = {
        logo: req.user.logo,
        companyName: req.user.companyName,
        email: req.user.email,
        website: req.user.website,
        address: `${req.user.city}  ${req.user.country}`
    }
    const checkSalaryDetails = await checkSalaryDetailsForEmployee({corporateUserID, employeeId, month, year})
    if (!checkSalaryDetails.status){
         return next(new ErrorResponse(checkSalaryDetails.message, 400));
    }
    let { status, message, data } = await downloadPayslip({ corporateUserID, employeeId, companyInfo, month, year })
    if (!status) {
        return next(new ErrorResponse(message, 400));
    }
    if (sendEmail === 'true') {
        const emailResponse = await emailPayslip(req, {
            corporateUserID,
            employeeId: employeeId,
            month,
            year,
            companyInfo
        });

        if (!emailResponse.status) {
            return next(new ErrorResponse(emailResponse.message, 400));
        }
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: sendEmail === 'true'
            ? 'Pay slip downloaded and emailed successfully'
            : 'Pay slip downloaded successfully',
        data
    });
})

exports.checkSalaryDetails = asyncHandler(async (req, res, next) => {

    const date = req.body.date;
    const employeeId = req.body.employeeId
    if (!(await isEmployeeOfCorporate(employeeId, req.user._id))) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    const checkConditions = await checkSalaryDate(date, employeeId, undefined, undefined, req.user._id);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'details fetched',
        data: { status: checkConditions }
    });

})

exports.approveSalary = asyncHandler(async (req, res) => {

    const { payingDate, month, year } = req.body;
    const paymentStatus = 'APPROVED'
    const corporateUserID = req.user._id;

    const params = {
        payingDate,
        month,
        year,
        paymentStatus,
        corporateUserID
    }

    const updatedData = await approveSalary(params);
    if (updatedData.success === false) {
        return res.status(400).json({
            status: false,
            message: updatedData.message,
            data: {},
            responseCode: '001'
        });
    }

    await emailSalaryApproved({
        req,
        corporateUserId: corporateUserID,
        month,
        year,
        logTraceId: req?.LogTraceId,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'salary approved',
        data: {}
    });

})

exports.getExcel = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { month, year } = req.query;

    //need to find start and end date for this salary cycle based on day specified in hr setting
    let { payrollSettings: { salaryCycleDay, payrollStartsFrom } = {}, officialDocuments } = await HrSettings.findOne({ corporateUser: corporateUserID });
    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    }
    let { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
    //- Check if cycleStart is less than payrollStartsFrom
    if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
        return next(new ErrorResponse('Cycle start date is earlier than payroll start date', 400));
    }

    let salaryDetails = await getExcelSalaryDetails({ cycleStart, cycleEnd, corporateUserID })

    let excelData = [];
    salaryDetails.forEach(function (employee) {
        if (employee.employee) {
            excelData.push({
                "Employee Name": employee?.employee?.fullName ?? "N/A",
                "Employee Id": employee?.employee?.employeeInformation?.employeeId ?? "N/A",
                "Designation": employee?.employee?.employeeInformation?.designation ?? "N/A",
                "Job Type": employee?.employee?.employeeInformation?.jobType ?? 'N/A',
                "Basic Salary": employee?.salaryInformation?.basicPay ?? "N/A",
                "Total Allowance": calculateTotalAllowance(employee.salaryInformation) ?? "N/A",
                "Monthly Salary": calculateTotalSalary(employee.salaryInformation) ?? "N/A",
                "Incentives": employee?.totalIncentive ?? 'N/A',
                "Bonus": employee?.totalBonus ?? 'N/A',
                "Overtime": employee?.totalOvertime ?? 'N/A',
                "Deduction": employee?.totalOtherDeduction ?? 'N/A',
                "Total Salary": employee?.totalPayable ?? 'N/A',
                "IBAN Number": employee?.employee?.bankDetails?.ibanNumber ?? 'N/A',
                "MOL Number": officialDocuments?.MOLNumber ?? "N/A",
                "Establishment ID":
                    officialDocuments?.establishmentId ?? "N/A",

            });
        }
    });
    generateExcelBufferAndType(excelData)
        .then(({ buffer, fileType }) => {
            // Now 'buffer' contains the Excel file in buffer form
            console.log('Excel buffer generated successfully.');
            console.log('File type:', fileType);
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: "Salary Details got successfully",
                data: { buffer, fileType },
            });
        })
        .catch(error => {
            console.error('Error generating Excel buffer and type:', error);
            next(error);
        });
})

exports.getSalaryDetails = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { month, year } = req.query;

    // HrSettings.findOne(...) itself can resolve to null (org hasn't completed onboarding
    // yet) — destructuring payrollSettings directly off that would throw before the
    // "not configured" check below ever runs. Optional-chain through it instead.
    const hrSettingsDoc = await HrSettings.findOne({ corporateUser: corporateUserID });
    let salaryCycleDay = hrSettingsDoc?.payrollSettings?.salaryCycleDay;

    // A real, non-trivial slice of orgs have OrganizationSettings configured (enough for
    // the Employees listing tab, calculateSalaryForEmp, to work fine) but no HrSettings
    // document at all — falling back to the same OrganizationSettings-based helper that
    // tab already relies on means this endpoint (and the pending-employee review it
    // powers) works for those orgs too, instead of unconditionally 400ing.
    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        try {
            const orgCycleSettings = await getSalaryCycleDay(corporateUserID);
            salaryCycleDay = orgCycleSettings ? orgCycleSettings.salaryCycleDay : undefined;
        } catch (e) {
            salaryCycleDay = undefined;
        }
    }

    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    }
    const { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID);

    const salaryDetails = await getSalaryInfo(corporateUserID, month, year, cycleStart, cycleEnd);

    res.status(200).json({
        status: true,
        data: salaryDetails,
        message: 'Salary details fetched successfully',
        responseCode: '000'
    });
})

exports.calculateSalaryForEmp = asyncHandler(async (req, res, next) => {

    let { corporateUserID, searchText, month, year } = extractStatementParams(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filterParam = (req.query.filter || '').toString().trim();
    const paymentStatuses = filterParam
        ? filterParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : undefined;
    ///////////////////////////
    const { payrollStartsFrom, salaryCycleDay,workingDays } = await getSalaryCycleDay(corporateUserID)

    ///////////////////////////
    //# 01
    // let { payrollSettings: { salaryCycleDay, payrollStartsFrom } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });
    // let { payrollSettings: { payrollFrom } = {} } = await OrganizationSettings.findOne({ corporateUser: corporateUserID });
    // let salaryCycleDay =17;
    if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
        return res.status(400).json({
            status: false,
            responseCode: '000',
            message: 'Organization onboarding is incomplete. Please complete the required setup to continue.',
        });
        // return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    }

    //# 02
    let { cycleStart, cycleEnd } = await calculateEmpSalaryCycleBasedOnMonth(month, year, salaryCycleDay, corporateUserID)
    const noOfWorkingDays = calculateWorkingDays({cycleStart,workingDays});
    // console.log({ cycleStart, cycleEnd, newDate: new Date() })
    // let calculatedTax = await calculateTax({regime:"old", ctc:110000,basicSalary:12000,dearnessAllowance:6000,hra:5000,
    //     conveyanceAllowance:1000,medicalAllowance:1000,bonus:200,overTime:500,pf:12,pfOpted:true,pfOptedVoluntary:0,rebate87=false})
    //  let calculatedTax = await calculateTax({regime:"old", ctc:110000,basicSalary:50000,dearnessAllowance:25000,hra:10000,
    //     conveyanceAllowance:2000,medicalAllowance:5000,bonus:10000,overTime:8000,pf:12,pfOpted:true,pfOptedVoluntary:15000,rebate87:true})    
    //  let calculatedTax = await calculateTax({regime:"old", ctc:110000,basicSalary:7500,dearnessAllowance:3750,hra:10000,
    //     conveyanceAllowance:2000,medicalAllowance:5000,bonus:2500,overTime:8000,pf:12,pfOpted:true,pfOptedVoluntary:0,rebate87:true,rentPaid:5000})    

    // let calculatedTax = await calculateTax({
    //     regime: "old", ctc: 110000, basicSalary: 1041667, dearnessAllowance: 520834, hra: 35000,
    //     conveyanceAllowance: 7500, medicalAllowance: 10000, bonus: 12500, overTime: 15000, pf: 12, pfOpted: true, pfOptedVoluntary: 1, rebate87: true, rentPaid: 100000, fy: 2024 - 25
    // })

    // console.log("calculate Tax", calculatedTax)

    // if (cycleStart >= currentDate) {
    //     return next(new ErrorResponse('Salary details not available for this date range', 400));
    // }

    //- Check if cycleStart is less than payrollStartsFrom
    // if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
    if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
        return next(new ErrorResponse('There are no employees for this month', 400));
        // } else if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
    } else if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
        cycleStart = payrollStartsFrom
    }

    // const unbankedEmployees = await unbankedEmployees(corporateUserID)
    //     if(unbankedEmployees){
    //         return next(new ErrorResponse('Please add bank details for all employees ', 400)); 
    //     }



    //# 03 - Process salary for the required period ans save to 'salary table'
    if (!searchText && page == 1) { //process salary only if the search text is empty and first page
        // let { status, message } = await processSalary({ month, year, corporateUserID, cycleStart, cycleEnd, payrollStartsFrom })
        // Pre-calculated rows are reused; only missing/stale employees are recalculated
        // (services/salarySync.js). ?recalculate=true forces the full run.
        let { status, message } = await ensureSalaryRecords({ month, year, corporateUserID, cycleStart, cycleEnd, payrollStartsFrom, salaryCycleDay, force: req.query.recalculate === 'true' })
        if (!status) return next(new ErrorResponse(message, 400));
    }
    // if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
    if (cycleStart < payrollStartsFrom && cycleEnd > payrollStartsFrom) {
        cycleStart = payrollStartsFrom
    }
    //# 04 - Fetch created salary records form 'salary table'
    let salaryDetails = await getSalaryDetails({ page, limit, searchText, cycleStart, cycleEnd, corporateUserID, noOfWorkingDays, paymentStatuses })
    // const hasMissingDepartmentName  =
    //     Array.isArray(salaryDetails?.rows) &&
    //     salaryDetails.rows.some(row =>
    //         !row.department ||
    //         typeof row.department !== 'object' ||
    //         !row.department.departmentName ||
    //         row.department.departmentName.trim() === ''
    //     );

    // if (hasMissingDepartmentName ) {
    //     return res.status(400).json({
    //         status: false,
    //         responseCode: '001',
    //         message: 'Please add departments for all employees',
    //         data: {}
    //     });
    // }

    if(salaryDetails.rows.length === 0 && !paymentStatuses){
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: `No salary data is available for this month. Payroll is set to start on ${humanReadableDate(payrollStartsFrom)}.`,
            data: salaryDetails
        });
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary details successfully fetched',
        data: salaryDetails
    });

})

exports.getAllSalaryDetailsByMonthExcelDownload = asyncHandler(async (req, res, next) => {
    try {
        const { corporateUserID, month, year, searchText } = extractStatementParams(req);
        const filterParam = (req.query.filter || '').toString().trim();
        const paymentStatuses = filterParam
            ? filterParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : undefined;

        // ---- GET SALARY CYCLE SETTINGS ----
        const { payrollStartsFrom, salaryCycleDay } =
            await getSalaryCycleDay(corporateUserID);

        // if (!Number.isInteger(salaryCycleDay)) {

            // return next(
            //     new ErrorResponse("HR settings not found or invalid salary cycle day", 400)
            // );
        // }

        // ---- CALCULATE SALARY CYCLE ----
        const { cycleStart, cycleEnd } =
            await calculateSalaryCycleBasedOnMonth(
                month,
                year,
                salaryCycleDay,
                corporateUserID
            );

        if (cycleStart < payrollStartsFrom && cycleEnd < payrollStartsFrom) {
            return next(
                new ErrorResponse("Cycle start date is earlier than payroll start date", 400)
            );
        }

        const aggregationPipeline = [
            {
                $match: {
                    corporateUser: corporateUserID,
                    salaryCycleStart: { $gte: new Date(cycleStart) },
                    salaryCycleEnd: { $lte: new Date(cycleEnd) },
                    ...(paymentStatuses && { paymentStatus: { $in: paymentStatuses } })
                }
            },

            // Handle employee as string OR ObjectId
            {
                $addFields: {
                    employeeObjId: {
                        $cond: [
                            { $eq: [{ $type: "$employee" }, "string"] },
                            { $toObjectId: "$employee" },
                            "$employee"
                        ]
                    }
                }
            },

            {
                $lookup: {
                    from: "employee",
                    localField: "employeeObjId",
                    foreignField: "_id",
                    as: "employee"
                }
            },

            {
                $unwind: {
                    path: "$employee",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "departments",
                    let: { departmentId: "$employee.employeeInformation.department" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ["$$departmentId", null] },
                                        { $eq: ["$_id", "$$departmentId"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                departmentName: 1
                            }
                        }
                    ],
                    as: "department"
                }
            },

            {
                $unwind: {
                    path: "$department",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $addFields: {
                    monthlySalary: {
                        $sum: [
                            { $ifNull: ["$salaryInformation.basicPay", 0] },
                            { $ifNull: ["$salaryInformation.travelAllowances", 0] },
                            { $ifNull: ["$salaryInformation.homeAllowances", 0] },
                            { $ifNull: ["$salaryInformation.medicalAllowances", 0] },
                            { $ifNull: ["$salaryInformation.otherAllowances", 0] },
                            { $ifNull: ["$salaryInformation.other", 0] }
                        ]
                    }
                }
            },

            // ---- CLEANUP ----
            {
                $addFields: {
                    "employee.id": "$employee._id",
                    "employee._id": "$$REMOVE",
                    "employee.__v": "$$REMOVE",
                    "_id": "$$REMOVE",
                    "__v": "$$REMOVE"
                }
            }
        ];
        // ---- SEARCH FILTER (SAME AS UI) ----
        if (searchText) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        {
                            "employee.personalInformation.fullName": {
                                $regex: escapeSearch(searchText),
                                $options: "i"
                            }
                        },
                        {
                            "employee.employeeInformation.employeeId": {
                                $regex: escapeSearch(searchText),
                                $options: "i"
                            }
                        },
                        {
                            "employee.employeeInformation.designation": {
                                $regex: escapeSearch(searchText),
                                $options: "i"
                            }
                        }
                    ]
                }
            });
        }

        const salaryRows = await Salary.aggregate(aggregationPipeline);
        // =====================================================
        // 📊 EXCEL DATA MAPPING (UI MATCHED)
        // =====================================================
        if (!salaryRows || salaryRows.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No data available for export",
                data: {},
                responseCode: '001'
            });
        }
        const excelData = salaryRows.map(row => {
            const emp = row.employee || {};
            const info = emp.employeeInformation || {};
            const dept = row.department || {};

            // UI logic
            const basic = Number(row.salaryInformation?.basicPay || 0);

            // UI shows monthlySalary directly as Total Allowance
            const allowance = Number(row.salaryInformation?.hraAmount  || 0) +
            Number(row.salaryInformation?.daAmount   || 0) + Number(row.salaryInformation?.incentiveAmount   || 0) +
            Number(row.salaryInformation?.increamentAmount || 0) + Number(row.salaryInformation?.other || 0) 

            // UI shows 0 deduction in table (even if EPF exists internally)
            const deduction = Number(row.salaryInformation?.deductionAmount || 0) +
            Number(row.salaryInformation?.leavesAmount || 0);

            // UI uses totalPayable directly
            const netSalary = Number(row.totalPayable || 0);


            return {
                "Employee Name": emp.personalInformation?.fullName || emp.fullName || "N/A",
                "Employee Id": info.employeeId || "N/A",
                "Designation": info.designation || "N/A",
                "Department": dept.departmentName || "N/A",
                "Basic Salary": basic,
                "Total Allowance": allowance,
                "Total Deduction": deduction,
                "Net Salary": netSalary,
                "Status": row.paymentStatus || "UPCOMING",
                "EmailID":emp.personalInformation?.email  || "N/A",  
                "Job Type":info?.contractType  || "N/A",
                "Salary cycle start Date":cycleStart || "N/A",
                "Salary cycle end Date":cycleEnd || "N/A",
            };

        });
        const { buffer, fileType } =
            await generateExcelBufferAndType(excelData);

        return res.status(200).json({
            status: true,
            message: "Salary Excel downloaded successfully",
            data: { buffer, fileType }
        });

    } catch (error) {
        console.error("Error in salary excel download:", error);
        next(error);
    }
});

exports.empApproveSalary = asyncHandler(async (req, res) => {

    const { payingDate, month, year } = req.body;
    const paymentStatus = 'APPROVED'
    const corporateUserID = req.user._id;

    const params = {
        payingDate,
        month,
        year,
        paymentStatus,
        corporateUserID
    }

    const updatedData = await empApproveSalary(params);
    if (updatedData.success === false) {
        return res.status(400).json({
            status: false,
            message: updatedData.message,
            data: {},
            responseCode: '001'
        });
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'salary approved',
        data: {}
    });

})

exports.markAsPaid = asyncHandler(async (req, res) => {
    const { payingDate, month, year } = req.body;
    const corporateUserID = req.user._id;

    const result = await markSalaryAsPaid({ payingDate, month, year, corporateUserID });

    if (!result.success) {
        return res.status(400).json({ status: false, responseCode: '001', message: result.message, data: {} });
    }
    return res.status(200).json({ status: true, responseCode: '000', message: result.message, data: {} });
});

exports.markAsApproved = asyncHandler(async (req, res) => {
    const { month, year } = req.body;
    const corporateUserID = req.user._id;

    const result = await revertSalaryToApproved({ month, year, corporateUserID });

    if (!result.success) {
        return res.status(400).json({ status: false, responseCode: '001', message: result.message, data: {} });
    }
    return res.status(200).json({ status: true, responseCode: '000', message: result.message, data: {} });
});

exports.empProfileSalary = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    let employeeId = req.params.id
    let month = req.query.month
    let year = req.query.year
    const data = await salaryProfileEmp({corporateUserID, employeeId, month, year})
    if (!data.status){
         return next(new ErrorResponse(data.message, 400));
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary Profile fetch successfully ',
        data
    });
})

exports.empProfileSalaryV2 = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    let employeeId = req.params.id
    let month = req.query.month
    let year = req.query.year
    const data = await salaryProfileEmpV2({corporateUserID, employeeId, month, year})
    if (!data.status){
         return next(new ErrorResponse(data.message, 400));
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary Profile fetch successfully ',
        data
    });
})

exports.payrollHistory = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    let year = req.query.year
    const data = await payrollHistory({corporateUserID, year})
    if (!data.status){
         return next(new ErrorResponse(data.message, 400));
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Payroll History fetch successfully ',
        data
    });
})

exports.payrollHistoryExcel = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    let year = req.query.year
    const data = await payrollHistory({corporateUserID, year})
    if (!data.status){
         return next(new ErrorResponse(data.message, 400));
    }

    const excelData = (data.salaryRows || []).map((item) => ({
        "Month": Number.isInteger(item?.month) && item.month >= 1 && item.month <= 12
            ? new Date(2000, item.month - 1, 1).toLocaleString('en-US', { month: 'long' })
            : "N/A",
        "Year": item?.year ?? "N/A",
        "Created Date": item?.createdDate ? humanReadableDate(item.createdDate) : "N/A",
        "Processed On": item?.processedOn ? humanReadableDate(item.processedOn) : "N/A",
        "Total Employees": item?.totalEmployees ?? 0,
        "Total Amount": item?.totalAmount ?? 0,
        "Salary Status": item?.salaryStatus ?? "N/A"
    }));

    if (excelData.length === 0) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: "No payroll history available for export",
            data: {}
        });
    }

    const { buffer, fileType } = await generateExcelBufferAndType(excelData);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Payroll History fetched successfully',
        data: { buffer, fileType }
    });
})

exports.empMonthlyApproveSalary = asyncHandler(async (req, res) => {

    const { payingDate, month, year } = req.body;
    let employeeId = req.params.id
    const paymentStatus = 'APPROVED'
    const corporateUserID = req.user._id;

    const params = {
        payingDate,
        month,
        year,
        paymentStatus,
        corporateUserID,
        employeeId
    }

    const updatedData = await empMonthlyApproveSalary(params);
    if (updatedData.success === false) {
        return res.status(400).json({
            status: false,
            message: updatedData.message,
            data: {},
            responseCode: '001'
        });
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'salary approved',
        data: {}
    });

})

exports.salaryHistoryList = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id.toString();
    const { year } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { rows, count } = await salaryHistoryList({ corporateUserID, year, page, limit });
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary history fetched successfully',
        data: { count, page, limit, rows },
    });
});

exports.salaryStatsList = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id.toString();
    const { year, status, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getSalaryHistoryList({
        corporateUserID,
        year,
        status,
        page,
        limit,
        searchText,
    });
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary stats fetched successfully',
        data: { count: result.count || 0, page, limit, rows: result.rows || [] },
    });
});

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.salaryStatsExcel = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id.toString();
    const { year, searchText } = req.query;

    const result = await getSalaryHistoryList({
        corporateUserID,
        year,
        page: 1,
        limit: 10000,
        searchText,
    });

    if (!result.status || !result.rows || result.rows.length === 0) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'No salary stats available for export',
            data: {},
        });
    }

    const excelData = result.rows.map((item) => {
        const salaryMap = {};
        (item.salaries || []).forEach(({ month, amount }) => {
            salaryMap[month] = amount;
        });

        const row = {
            'Emp ID': item.employeeCode || '-',
            'Employee Name': item.employeeName || '-',
        };
        MONTH_NAMES.forEach((name, idx) => {
            const amount = salaryMap[idx + 1];
            row[name] = amount !== undefined ? amount : '-';
        });
        return row;
    });

    const { buffer, fileType } = await generateExcelBufferAndType(excelData);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary stats exported successfully',
        data: { buffer, fileType },
    });
});

exports.salaryHistoryDetail = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id.toString();
    const { month, year, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (!month || !year) return next(new ErrorResponse('month and year are required', 400));
    const result = await salaryHistoryDetail({ corporateUserID, month, year, page, limit, search });
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary history detail fetched successfully',
        data: result,
    });
});

exports.salaryHistoryReport = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id.toString();
    const { month, year } = req.query;
    if (!month || !year) return next(new ErrorResponse('month and year are required', 400));

    const [reportData, orgSettings] = await Promise.all([
        salaryHistoryDetail({ corporateUserID, month, year, page: 1, limit: 10000 }),
        OrganizationSettings.findOne({ corporateUser: corporateUserID })
            .select('companyProfile')
            .lean(),
    ]);

    const profile = orgSettings?.companyProfile || {};
    const str = (v) => (v && typeof v === 'string' ? v.trim() : '');
    const addressParts = [
        str(profile.companyAddressLine1),
        str(profile.companyAddressLine2),
        str(profile.city),
        str(profile.state),
        str(profile.pinCode),
    ].filter(Boolean);

    const companyInfo = {
        companyName: str(profile.companyName),
        address: addressParts.join(', '),
        logo: str(profile.companyLogo),
    };

    const { pdfData, filename } = await generateSalaryHistoryReportPdf({
        reportData, companyInfo, month, year,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary history report generated successfully',
        data: {
            buffer: pdfData.toString('base64'),
            filename,
            fileType: 'application/pdf',
        },
    });
});

exports.salaryHistorySimpleReport = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id.toString();
    const { month, year } = req.query;
    if (!month || !year) return next(new ErrorResponse('month and year are required', 400));

    const { generateExcelBufferAndType } = require('../utils/documentToBuffer');
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = MONTHS[Number(month) - 1] || month;

    const rows = await salaryHistoryDetailAll({ corporateUserID, month, year });

    const excelData = rows.map(r => ({
        'Emp ID': r.empId,
        'Employee Name': r.name,
        'Email': r.email,
        'Account Detail': r.accountDetail,
        'Trans. Type': r.transType,
        'Gross Salary': r.grossSalary,
        'Deduction': r.deduction,
        'Net Payable Salary': r.netPayable,
        'Status': r.paymentStatus,
    }));

    if (rows.length === 0) {
        return next(new ErrorResponse('No salary data found for this month', 400));
    }

    const { buffer, fileType } = await generateExcelBufferAndType(excelData);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary history report generated successfully',
        data: {
            buffer: buffer.toString('base64'),
            filename: `SalaryReport-${monthName}-${year}.xlsx`,
            fileType,
        },
    });
});

// Old Tax Regime only: HR enters the monthly TDS computed outside the platform, applied
// from the given month until a later entry replaces it.
exports.updateTdsOverride = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;
    const { month, year, amount, applyToFutureMonths } = req.body;

    const result = await setTdsOverride({ corporateUserID, employeeId, month, year, amount, applyToFutureMonths });

    if (!result.success) {
        return res.status(400).json({ status: false, responseCode: '001', message: result.message, data: {} });
    }
    return res.status(200).json({ status: true, responseCode: '000', message: result.message, data: result.data });
});

// Old Tax Regime status + the HR-entered TDS in force for a month (defaults to the
// current month) — for the Salary Structure tab, which isn't tied to a processed month.
exports.getTdsOverride = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const result = await getTdsOverrideInfo({ corporateUserID, employeeId, month, year });

    if (!result.success) {
        return res.status(400).json({ status: false, responseCode: '001', message: result.message, data: {} });
    }
    return res.status(200).json({ status: true, responseCode: '000', message: 'TDS details fetched successfully', data: result.data });
});

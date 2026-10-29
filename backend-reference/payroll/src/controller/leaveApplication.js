const { getAllLeaves, findExistingLeave, createLeaveApplication, findExistingLeaveSpecified, getLeavesForEmployee,updateLeaveApplication, getExcelLeaveDetails, findLeaveRequests } = require("../models/use-cases/leaveApplication");
const ErrorResponse = require("../utils/error-response");
const Employee = require('../models/entities/employee');
const HrSettings = require('../models/entities/hrSettings');
const LeaveApplication = require('../models/entities/leaveApplication');
const LeaveComponent=require('../models/entities/leaveComponent')
const EmployeeLeaveBalance=require('../models/entities/leaveBalance')
const { getAvailableLeaves, validateLeaveCount, getTakenLeaves } = require('../services/leaveApplication');
const { leaveSubmission, leaveReSubmission } = require('../utils/email/emailTemplates/announcement');
const { leaveStatusUpdate, leaveApprovedEmail } = require('../utils/email/emailTemplates/leaveStatusUpdate');
const emailer = require('../utils/email/emailer');
const { findOneHrSettings } = require('../models/use-cases/hrSettings');
const { fetchPartnerBranding } = require('../services/partnerDetailsResolver');
const { resolveDynamicEmail } = require('../services/emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { humanReadableDateTime, humanReadableDate } = require('../utils/dateUtils');
const { customLog } = require('../utils/loggerHelper');
const { checkSalaryDate } = require('../utils/salaryDate');
const { calculateSalaryCycleBasedOnMonth } = require('../services/salary');
const asyncHandler = require("../middleware/async");
const { verifyEffectiveDateForCompensationComponents } = require("../services/commonServices");
const { generateExcelBufferAndType } = require("../utils/documentToBuffer");
const { escapeSearch } = require('../utils/escapeRegex');
const { ObjectId } = require('mongoose').Types; // Import ObjectId from Mongoose

// Two call sites below send this same email — resolve once here.
const resolveLeaveSubmissionEmail = async (req, { employeeName, start, end, hrDetails, partnerId }) => {
    const logo = hrDetails?.companyProfile?.companyLogo || hrDetails?.corporateUser?.logo;
    const website = hrDetails?.corporateUser?.website;
    const companyName = hrDetails?.companyProfile?.companyName || hrDetails?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    const footerBranding = isPartner ? partnerBranding?.branding : undefined;

    return resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_SUBMISSION,
        variables: {
            employeeName,
            start,
            end,
            // branding shows the employee's own corporate in the header; the footer's
            // partner-icon-hiding gate uses the genuine reseller partner's brand instead
            // (undefined when there isn't one, so icons correctly show).
            ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding }),
        },
        fallbackSubject: 'Leave Submission Confirmation',
        fallbackHtml: leaveSubmission({ employeeName, start, end }, hrDetails, footerBranding),
        partnerId,
    });
};

const leaveLabels = {
    annualLeave: 'Annual Leave',
    sickLeave: 'Sick Leave',
    parentalLeave: 'Parental Leave',
    sabbaticalLeave: 'Sabbatical Leave',
    studyLeave: 'Study Leave',
    HajjAndUmrahLeave: 'Hajj And Umrah Leave',
    maternityLeave: 'Maternity Leave',
    officialLeavesAndVacations: 'Official Leaves And Vacations',
    otherPaidLeaves: 'Other Paid Leaves'
};

exports.getAllLeaves = asyncHandler(async (req, res, next) => {
console.log("inside conteoller")
    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const year = req.query.year;
    const month = req.query.month;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;

    const params = {
        corporateUserID,
        page,
        limit,
        searchText,
        skip,
        year,
        month
    }

    const result = await getAllLeaves(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while generating leaves', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leaves fetched successfully',
        data: result
    });

})

exports.getAvailableLeaves = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id

    let { data } = await getAvailableLeaves({ employeeId, corporateUserID })

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved leaves successfully',
        data: { availableLeaves: data }
    });
})

exports.getLeavesTaken = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.employeeId

    let { data } = await getTakenLeaves({ employeeId, corporateUserID })

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved leaves successfully',
        data: { takenLeaves: data }
    });
})
exports.getLeavesExcel = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { month, year,searchText } = req.query;

    if ( !year) {
        return next(new ErrorResponse('Year is required', 400));
    }

    
    let startDate, endDate;
    if (month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
        startDate = new Date(year, 0, 1, 0, 0, 0);
        endDate = new Date(year, 11, 31, 23, 59, 59);
    }
    void startDate; void endDate;

    const leaveDetails = await getExcelLeaveDetails({
        corporateUserID,
        year,
        month,
        searchText
    });

    let excelData = [];

    leaveDetails.forEach(leave => {
        if (!leave.employee) return;

        excelData.push({
            "Name": leave.employee.personalInformation.fullName ?? "N/A",
            "Employee ID": leave.employee.employeeInformation?.employeeId ?? "N/A",
            "Leave Type": leave?.typeOfLeave?.leaveType || "-",
            "Start Date": humanReadableDateTime(leave.start),
            "End Date": humanReadableDateTime(leave.end),
            "Leave Duration": leave.leaveCount,
            "Leave Balance": leave.leaveBalance,
        });
    });

    if(excelData.length<1){
        return next(new ErrorResponse("No Data Found",400))
    }
    generateExcelBufferAndType(excelData)
        .then(({ buffer, fileType }) => {
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Leave Excel generated successfully',
                data: { buffer, fileType },
            });
        })
        .catch(next);
});

exports.createLeave = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const { start, end, leaveCount, typeOfLeave } = req.body;

    if (new Date(end) < new Date(start)) {
        return next(new ErrorResponse('Please ensure that the end date is after the start date.', 400));
    }
    const isVerified = await verifyEffectiveDateForCompensationComponents(corporateUserID, employeeId, start);
    if (!isVerified.status) {
        return next(new ErrorResponse(isVerified.message, 400));
    }

    const payrollDetails = await HrSettings.findOne({ corporateUser: corporateUserID })
        .select('payrollSettings.salaryCycleDay');

    const salaryCycleDay = payrollDetails?.payrollSettings?.salaryCycleDay;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.getMonth() + 1; // Months are zero-based
    const startYear = startDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();

    let cyclesToCheck = [];

    // Handle case where leave spans across multiple months/years
    if (startYear === endYear) {
        for (let month = startMonth; month <= endMonth; month++) {
            cyclesToCheck.push({ month, year: startYear });
        }
    } else {
        // Add remaining months of the start year
        for (let month = startMonth; month <= 12; month++) {
            cyclesToCheck.push({ month, year: startYear });
        }
        // Add all months of the years in between
        for (let year = startYear + 1; year < endYear; year++) {
            for (let month = 1; month <= 12; month++) {
                cyclesToCheck.push({ month, year });
            }
        }
        // Add the months of the end year
        for (let month = 1; month <= endMonth; month++) {
            cyclesToCheck.push({ month, year: endYear });
        }
    }

    let checkStatus = true;
    let checkMessage = '';

    for (const cycle of cyclesToCheck) {
        let { cycleStart, cycleEnd } = await calculateSalaryCycleBasedOnMonth(cycle.month, cycle.year, salaryCycleDay, corporateUserID);

        const checkConditions = await checkSalaryDate(start, employeeId, cycleStart, cycleEnd);

        if (!checkConditions.status) {
            checkStatus = false;
            checkMessage = checkConditions.message;
            break;
        }
    }

    if (!checkStatus) {
        return next(new ErrorResponse(checkMessage, 400));
    }

    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID }).lean();
    if (!existingHrSettings) {
        return next(new ErrorResponse('Please define your corporate HR setting before applying leave', 400));
    }

    const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
    if (!employee) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    const doj = employee.employeeInformation.dateOfJoin;

    if (new Date(start) < new Date(doj)) {
        return next(new ErrorResponse('Start date should be greater than the date of join', 400));
    }

    const existingLeave = await findExistingLeave(corporateUserID, employeeId, start, end);

    if (existingLeave) {
        return next(new ErrorResponse('Leave already exists for the specified period.', 400));
    }

    let { status, data, message } = await getAvailableLeaves({ employeeId, corporateUserID });
    if (!status) {
        return next(new ErrorResponse(message, 400));
    }

    let isAvailable = await validateLeaveCount(data, typeOfLeave, leaveCount, false);
    if (!isAvailable) {
        return next(new ErrorResponse(`${leaveLabels[typeOfLeave]} is not available`, 400));
    }

    const leaveData = req.body;

    const createdLeaveApplication = await createLeaveApplication(corporateUserID, employeeId, leaveData);

    const to = employee.personalInformation?.email;
    const hrDetails = await findOneHrSettings(corporateUserID);
    const leaveStart = humanReadableDateTime(start);
    const leaveEnd = humanReadableDateTime(end);
    const resolved = await resolveLeaveSubmissionEmail(req, {
        employeeName: employee.personalInformation?.fullName,
        start: leaveStart,
        end: leaveEnd,
        hrDetails,
        partnerId: req.user?.registeredBy || null,
    });
    const emailReponse = await emailer.email(to, resolved.subject, resolved.html);

    if (!emailReponse.status) {
        return next(new ErrorResponse(emailReponse.message || 'Failed to send emails', 500));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leave created successfully',
        data: createdLeaveApplication
    });

})


//create leave for employee based on the selected leave policy

exports.createLeaveApplication = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;  // Authenticated corporate user
    const employeeId = req.params.id;  // Employee ID passed in URL
    const { start, end, leaveCount, typeOfLeave,halfDaySelection } = req.body;  // Data from request body
    // 1. Validate start and end date
    if (new Date(end) < new Date(start)) {
        return next(new ErrorResponse('Please ensure that the end date is after the start date.', 400));
    }

    // 2. Check employee exists and last working day has not passed
    const employeeRecord = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
    if (!employeeRecord) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    const lastWorkingDay = employeeRecord.offBoardingInformation?.lastWorkingDay;
    if (lastWorkingDay) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lwd = new Date(lastWorkingDay);
        lwd.setHours(0, 0, 0, 0);
        if (lwd < today) {
            return next(new ErrorResponse("Leave cannot be applied. The employee's last working day has already passed.", 400));
        }
        const leaveEnd = new Date(end);
        leaveEnd.setHours(0, 0, 0, 0);
        if (leaveEnd > lwd) {
            return next(new ErrorResponse("Leave cannot be applied after the last working day.", 400));
        }
    }

    // 3. Fetch leave component data (either global or employee-specific)
    const leaveComponent = await LeaveComponent.findOne({
        corporateUser: corporateUserID,
        _id: typeOfLeave,  // Match the leave type for either global or employee-specific policies
    });

    if (!leaveComponent) {
        return next(new ErrorResponse('Leave component not found for this employee or global policy.', 400));
    }

    // 3. Calculate available leave by adding carryover if allowed
    let availableLeave = leaveComponent.maximumNumberOfLeaves;
    let leaveType  = leaveComponent.leaveType ;
    if (leaveComponent.leaveBalanceCarryover === 'ALLOWED') {
        availableLeave += leaveComponent.carryOverBalance || 0;  // Add carryover from previous year
    }

    // 4. Check if employee has enough leave balance
    if (availableLeave < leaveCount) {
        // return next(new ErrorResponse(`You only have ${availableLeave} days of ${leaveType} available.`, 400));
        return next(new ErrorResponse(`Leave cannot be added. Requested duration exceeds the available ${leaveType} balance (${availableLeave} days)`, 400));
    }

    // 5. Apply the leave and update balance
    void (availableLeave - leaveCount);

    // Step 6: Check if the employee has an existing leave balance record
    let employeeLeaveBalance = await EmployeeLeaveBalance.findOne({ employee: employeeId });
    const leaveBalance = await LeaveApplication.aggregate([
        {
            $match: {
                corporateUser: corporateUserID,
                employee: new ObjectId(employeeId),
                leaveComponent: typeOfLeave,
            },
        },
        {
            $group: {
                _id: null,
                totalLeave: { $sum: '$leaveCount' },
            },
        },
    ]);
    const balanceLeave = leaveComponent.maximumNumberOfLeaves - (leaveBalance[0]?.totalLeave || 0);
    if (!employeeLeaveBalance) {
        // Create a new leave balance record if it doesn't exist
        employeeLeaveBalance = new EmployeeLeaveBalance({
            employee: employeeId,
            leavePolicies: [{
                leaveComponent: leaveComponent._id,
                availableLeave: leaveComponent.maximumNumberOfLeaves,
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            }],
        });
        await employeeLeaveBalance.save();
    } else {
        // Update the leave policy for this employee
        const leavePolicyIndex = employeeLeaveBalance.leavePolicies.findIndex(
            (policy) => policy.leaveComponent.toString() === leaveComponent._id.toString()
        );
       

        if (leavePolicyIndex === -1) {
            // If no policy exists for this leave type, add it
            employeeLeaveBalance.leavePolicies.push({
                leaveComponent: leaveComponent._id,
                availableLeave: leaveComponent.maximumNumberOfLeaves,
                carryOverBalance: leaveComponent.carryOverBalance || 0,
            });
        } else {
            // If policy exists, update the available leave
            
            if (balanceLeave >= leaveCount) {
                // Subtract the leaveCount only if availableLeave is greater than or equal to leaveCount
                employeeLeaveBalance.leavePolicies[leavePolicyIndex].availableLeave -= leaveCount;
            } else {
                // Set availableLeave to 0 if it's less than leaveCount
                if (employeeLeaveBalance.leavePolicies[leavePolicyIndex].availableLeave === 0) {
                    return next(new ErrorResponse(`You have no available ${leaveComponent.leaveType} left. Please check your balance or request additional leave.`, 400));
                } else {
                    // Set availableLeave to 0 if it's less than leaveCount
                    // employeeLeaveBalance.leavePolicies[leavePolicyIndex].availableLeave = 0;
                    return next(new ErrorResponse(`You only have ${employeeLeaveBalance.leavePolicies[leavePolicyIndex].availableLeave} days of ${leaveComponent.leaveType} available, which is insufficient for the requested ${leaveCount} days.`, 400));
                }
                

            }
        }

        // Save updated leave balance
        await employeeLeaveBalance.save();
    }

    // 6. Create the leave application record
    const leaveData = {
        corporateUser: corporateUserID,
        employee: employeeId,
        start,
        end,
        leaveCount,
        typeOfLeave,
        halfDaySelection
    };

    const createdLeaveApplication = await createLeaveApplication(leaveData);
    
    if (!createdLeaveApplication.status) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: createdLeaveApplication.message, 
            data: {}
        });
    }

    // 7. Send email confirmation. Best-effort: the leave and balance are already
    // saved, so an email failure shouldn't fail the whole request.
    const employee = await Employee.findById(employeeId);
    const to = employee.personalInformation.email;
    if (to) {
        const hrDetails = await findOneHrSettings(corporateUserID);
        const leaveStart = humanReadableDateTime(start);
        const leaveEnd = humanReadableDateTime(end);

        try {
            const resolved = await resolveLeaveSubmissionEmail(req, {
                employeeName: employee.personalInformation?.fullName,
                start: leaveStart,
                end: leaveEnd,
                hrDetails,
                partnerId: req.user?.registeredBy || null,
            });
            const emailResponse = await emailer.email(to, resolved.subject, resolved.html);
            if (!emailResponse.status) {
                console.error('Leave submission email failed:', emailResponse.message);
            }
        } catch (error) {
            console.error('Leave submission email failed:', error.message);
        }
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leave created successfully',
        data: createdLeaveApplication.data,
    });
});




//create leave for employee based on the selected leave policy

exports.updateLeaveApplication = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const leaveId = req.params.id;
    
    const { start, end, leaveCount, typeOfLeave,halfDaySelection } = req.body;

    // Validate start and end dates
    if (new Date(end) < new Date(start)) {
        return next(new ErrorResponse('End date must be after start date.', 400));
    }

    // Update logic via use case
    const updatedLeave = await updateLeaveApplication({
        corporateUser: corporateUserID,
        leaveId,
        start,
        end,
        leaveCount,
        typeOfLeave,
        halfDaySelection
    });

    if (!updatedLeave.status) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: updatedLeave.message,
            data: {},
        });
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave updated successfully',
        data: updatedLeave.data,
    });
});






exports.updateLeave = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const leaveId = req.params.id;

    //check if the leave is existing with the given id
    const findLeave = await LeaveApplication.findOne({ _id: leaveId, corporateUser: corporateUserID });
    if (!findLeave) {
        return next(new ErrorResponse('No Leave details found using this id', 400));
    }
    let existingLeaveCount = findLeave.leaveCount

    const employeeId = findLeave.employee;

    const { start, end, leaveCount, typeOfLeave, leaveSupportingDocs } = req.body;
    if (end < start) {
        return next(new ErrorResponse('Please ensure that the end date is after the start date.', 400));
    }
    const isVerified = await verifyEffectiveDateForCompensationComponents(corporateUserID, employeeId, start);
    if (!isVerified.status) {
        return next(new ErrorResponse(isVerified.message, 400));
    }

    const checkConditions = await checkSalaryDate(start, employeeId);

    if (!checkConditions.status) {
        // return next(new ErrorResponse('The date that you have provided is not valid.', 400));
        return next(new ErrorResponse(checkConditions.message, 400));
    }

    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID }).lean();
    if (!existingHrSettings) {
        return next(new ErrorResponse('Please define your corporate HR setting before applying leave', 400));
    }
    const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
    // Need to validate leave start is greater than DOJ
    let doj = employee.employeeInformation.dateOfJoin
    if (new Date(start) < doj) {
        return next(new ErrorResponse('Start date should be greater than the date of join', 400));
    }

    const existingLeave = await findExistingLeaveSpecified(leaveId, corporateUserID, employeeId, start, end);

    if (existingLeave) {
        return next(new ErrorResponse('Leave already exists for the specified period.', 400));
    }

    // let leaveDetails = await calculateLeaveAndHours(employee?.employeeInformation.workingHours, start, end, corporateUserID);
    // console.log({ leaveDetails })
    // if (leaveDetails.leaveCount !== leaveCount) {
    //     return next(new ErrorResponse('Something went wrong in leave calculation.', 400));
    // }
    // if (leaveDetails.leaveCount < 0.5) {
    //     return next(new ErrorResponse('Invalid leave application', 400));
    // }
    // Check whether this leave is applicable under the typeOfLeave he is applying for
    let { status, data, message } = await getAvailableLeaves({ employeeId, corporateUserID })
    if (!status) {
        return next(new ErrorResponse(message, 400));
    }

    let isAvailable = await validateLeaveCount(data, typeOfLeave, leaveCount, existingLeaveCount)
    if (!isAvailable) {
        return next(new ErrorResponse(`${leaveLabels[typeOfLeave]} is not available`, 400));
    }

    const updatingData = {
        corporateUser: corporateUserID,
        employee: employeeId,
        start,
        end,
        leaveCount,
        typeOfLeave,
        leaveSupportingDocs

    }

    //update leave
    const updateLeave = await LeaveApplication.updateOne({ _id: leaveId, corporateUser: corporateUserID }, updatingData)

    const isMorethanADay = (end - start) > 24 * 60 * 60 * 1000

    const to = employee.personalInformation?.email;
    const subject = `Leave date${isMorethanADay ? "s" : ""} revised as per your request`
    const hrDetails = await findOneHrSettings(corporateUserID)
    const leaveStart = humanReadableDateTime(start)
    const leaveEnd = humanReadableDateTime(end)
    const logo = hrDetails?.companyProfile?.companyLogo || hrDetails?.corporateUser?.logo;
    const website = hrDetails?.corporateUser?.website;
    const companyName = hrDetails?.companyProfile?.companyName || hrDetails?.corporateUser?.companyName;
    const resubmitPartnerBranding = await fetchPartnerBranding(req);
    const resubmitIsPartner = !!req.user?.registeredBy;
    const resubmitFooterBranding = resubmitIsPartner ? resubmitPartnerBranding?.branding : undefined;
    const resolved = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_RESUBMISSION,
        variables: {
            employeeName: employee.personalInformation?.fullName,
            start: leaveStart,
            end: leaveEnd,
            hrManagerName: hrDetails?.officialDocuments?.hrManagerName || '',
            // branding shows the employee's own corporate in the header; the footer's
            // partner-icon-hiding gate uses the genuine reseller partner's brand instead
            // (undefined when there isn't one, so icons correctly show).
            ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding: resubmitFooterBranding }),
        },
        fallbackSubject: subject,
        fallbackHtml: leaveReSubmission({ employeeName: employee.personalInformation?.fullName, start: leaveStart, end: leaveEnd }, hrDetails, resubmitFooterBranding),
        partnerId: req.user?.registeredBy || null,
    });
    const emailReponse = await emailer.email(to, resolved.subject, resolved.html)
    if (!emailReponse.status) {
        return next(new ErrorResponse(emailReponse.message || 'Failed to send emails', 500));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Leave updated successfully',
        data: updateLeave
    });

})

exports.deleteLeave = asyncHandler(async (req, res, next) => {
    let leaveId = req?.params?.id
    if (!leaveId || !ObjectId.isValid(leaveId)) return next(new ErrorResponse('Leave Id is required', 404));
    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
   
    const deletedLeave = await LeaveApplication.findOneAndDelete({ _id: leaveId, corporateUser: userId });
    const leaveBalanceDoc = await EmployeeLeaveBalance.findOne({ employee: deletedLeave.employee });

    if (leaveBalanceDoc) {
        // Add back the leave count
        leaveBalanceDoc.leavePolicies.find(policy => policy.leaveComponent.toString() === deletedLeave.typeOfLeave.toString()).availableLeave += deletedLeave.leaveCount;
        await leaveBalanceDoc.save();
    }

    if (!deletedLeave) {
        return next(new ErrorResponse('Failed to delete leave', 500));
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave deleted successfully',
        data: deletedLeave
    });
})

exports.getLeaveDetails = asyncHandler(async (req, res) => {

    const { leaveId } = req.params;

    const leaveData = await LeaveApplication.findOne({ _id: leaveId, corporateUser: req.user._id }).populate({
        path: 'employee',
        select: 'fullName'
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave fetched successfully',
        data: {
            leaveData
        }
    });

})

exports.getAllLeavesForEmployee = asyncHandler(async (req, res) => {

    const employeeId = req.params.id;
    const corporateUserID = req.user._id;
    const { page, limit,searchText  } = req.query;

    const leaves = await getLeavesForEmployee(employeeId, corporateUserID, page, limit,searchText);


    res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leaves fetched successfully for the employee',
        data: leaves
    });

})

// GET /leave-application/leave-requests
// Corporate side: paginated list of employees' ESS-submitted leave requests.
// Query: employee (id), from, to (ISO dates), status, search (name), page, limit
exports.getLeaveRequests = asyncHandler(async (req, res, next) => {
    const corporateUser = req.user._id.toString();
    const { employee, from, to, status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    const validStatuses = ['applied', 'approved', 'rejected', 'cancelledByEmployee'];
    if (status && !validStatuses.includes(status)) {
        return next(new ErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    let fromDate, toDate;
    if (from) { fromDate = new Date(from); fromDate.setHours(0, 0, 0, 0); }
    if (to) { toDate = new Date(to); toDate.setHours(23, 59, 59, 999); }

    let employeeIds;
    let searchOrConditions;
    if (employee) {
        employeeIds = [employee];
    } else if (search) {
        const [matchedEmployees, matchedLeaveTypes] = await Promise.all([
            Employee.find(
                { corporateUser, 'personalInformation.fullName': { $regex: escapeSearch(search), $options: 'i' } },
                '_id'
            ).lean(),
            LeaveComponent.find(
                { corporateUser, leaveType: { $regex: escapeSearch(search), $options: 'i' } },
                '_id'
            ).lean(),
        ]);
        const matchedEmployeeIds = matchedEmployees.map(e => e._id);
        const matchedLeaveTypeIds = matchedLeaveTypes.map(l => l._id);

        if (matchedEmployeeIds.length === 0 && matchedLeaveTypeIds.length === 0) {
            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Leave requests fetched successfully',
                data: [],
                pagination: { total: 0, page, limit, totalPages: 0 },
            });
        }

        searchOrConditions = [];
        if (matchedEmployeeIds.length) searchOrConditions.push({ employee: { $in: matchedEmployeeIds } });
        if (matchedLeaveTypeIds.length) searchOrConditions.push({ typeOfLeave: { $in: matchedLeaveTypeIds } });
    }

    const { records, total } = await findLeaveRequests(corporateUser, {
        employeeIds, searchOrConditions, status, from: fromDate, to: toDate, page, limit,
    });

    const employeeIdsOnRecords = [...new Set(records.map(r => r.employee?.toString()).filter(Boolean))];
    const employees = await Employee.find(
        { _id: { $in: employeeIdsOnRecords } },
        'personalInformation.fullName personalInformation.email profileImage employeeInformation'
    ).lean();
    const empMap = {};
    for (const emp of employees) empMap[emp._id.toString()] = emp;

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave requests fetched successfully',
        data: records.map(r => {
            const emp = empMap[r.employee?.toString()];
            return {
                _id: r._id,
                employee: {
                    _id: emp?._id ?? r.employee ?? null,
                    employeeId: emp?.employeeInformation?.employeeId ?? null,
                    fullName: emp?.personalInformation?.fullName ?? null,
                    email: emp?.personalInformation?.email ?? null,
                    profileImage: emp?.profileImage ?? null,
                    designation: emp?.employeeInformation?.designation ?? null,
                },
                typeOfLeave: r.isUnpaidLeave
                    ? { _id: 'UNPAID', leaveType: 'Unpaid Leave' }
                    : (r.typeOfLeave ?? null),
                start: r.start,
                end: r.end,
                leaveCount: r.leaveCount,
                halfDaySelection: r.halfDaySelection ?? null,
                reason: r.notes ?? null,
                status: r.status,
                createdAt: r.createdAt,
            };
        }),
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});

// PATCH /leave-application/:leaveId/status
// Corporate side: approve or reject a leave request.
// Body: status (approved | rejected), notes (optional)
exports.updateLeaveStatus = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { leaveId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: "status must be 'approved' or 'rejected'" });
    }

    const leave = await LeaveApplication.findOne({ _id: leaveId, corporateUser });
    if (!leave) {
        return res.status(404).json({ status: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'applied') {
        return res.status(400).json({ status: false, message: `Cannot update a leave that is already '${leave.status}'` });
    }

    leave.status = status;
    if (notes !== undefined) leave.notes = notes;
    await leave.save();

    // Notify the employee of the decision. Best-effort: a mail failure must
    // never fail the status update.
    try {
        const employee = await Employee.findOne(
            { _id: leave.employee, corporateUser },
            'personalInformation.fullName personalInformation.email'
        ).lean();
        const to = employee?.personalInformation?.email;
        if (to) {
            const hrDetails = await findOneHrSettings(corporateUser);
            const companyName = hrDetails?.companyProfile?.companyName || hrDetails?.corporateUser?.companyName;
            const partnerBranding = await fetchPartnerBranding(req);
            const isPartner = !!req.user?.registeredBy;
            // Logo/branding name stay exactly as fetchPartnerBranding resolves them - only
            // the website/link was wrong: fall back to the corporate's own saved website
            // when there's no genuine reseller partner registration, instead of Peko's own.
            const branding = {
                ...partnerBranding,
                website: isPartner ? partnerBranding?.website : (hrDetails?.corporateUser?.website || partnerBranding?.website),
            };
            const isApproved = status === 'approved';
            const leaveType = leaveLabels[leave.typeOfLeave] || leave.typeOfLeave;
            const start = humanReadableDate(leave.start);
            const end = humanReadableDate(leave.end);

            const params = {
                employeeName: employee.personalInformation?.fullName,
                companyName,
                leaveType,
                start,
                end,
                leaveCount: leave.leaveCount,
                status,
                notes: leave.notes,
            };

            const resolvedEmail = await resolveDynamicEmail({
                req,
                key: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_STATUS_UPDATE,
                variables: {
                    name: params.employeeName || 'Employee',
                    company: companyName || '',
                    headline: isApproved ? 'Your leave request has been approved.' : 'Your leave request has been rejected.',
                    leaveType: leaveType || '',
                    period: start === end ? start : `${start} to ${end}`,
                    days: leave.leaveCount === 1 ? '1 day' : `${leave.leaveCount} days`,
                    notes: leave.notes || '',
                    ...v2LayoutVariables(branding),
                },
                fallbackSubject: `Leave Request ${isApproved ? 'Approved' : 'Rejected'}`,
                fallbackHtml: isApproved
                    ? leaveApprovedEmail({ employeeName: params.employeeName }, branding)
                    : leaveStatusUpdate(params, branding),
                partnerId: req.user?.registeredBy || null,
            });
            const response = await emailer.email(to, resolvedEmail.subject, resolvedEmail.html);
            if (!response?.status) {
                customLog(req?.LogTraceId, 'error', { message: 'Failed to send leave status email', error: response?.message });
            }
        } else {
            customLog(req?.LogTraceId, 'info', { message: 'No email found for employee; skipped leave status email', leaveId });
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Failed to send leave status email', error: error?.message });
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: `Leave request ${status} successfully`,
        data: {
            _id: leave._id,
            employee: leave.employee,
            typeOfLeave: leave.typeOfLeave,
            start: leave.start,
            end: leave.end,
            leaveCount: leave.leaveCount,
            status: leave.status,
            notes: leave.notes ?? null,
        },
    });
});
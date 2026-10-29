const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/error-response");
const Employee = require("../models/entities/employee");
const BankDetails = require("../models/entities/bankDetails");
const HrSettings = require("../models/entities/hrSettings");
const {
    createProfileUpdateRequest,
    findOpenRequestByType,
} = require("../models/use-cases/profileUpdateRequest");
const { getAnnouncementsForUser } = require("../models/use-cases/announcement");
const {
    createReimbursementRequest,
    findReimbursementByEmployee,
    findReimbursementByIdForEmployee,
    cancelReimbursementRequest,
} = require("../models/use-cases/reimbursement");
const {
    upsertCheckIn,
    recordCheckOut,
    findAttendanceForDay,
    findAttendanceList,
    getMonthlyMetrics,
    findAttendanceById,
    findDeductionLog,
    materializeAbsentRecord,
} = require("../models/use-cases/attendanceRecord");
const {
    createOvertimeRequest,
    findOpenOvertimeRequestForDate,
    findOvertimeByEmployee,
    findOvertimeByIdForEmployee,
    cancelOvertimeRequest,
} = require("../models/use-cases/overTime");
const {
    createAttendanceDispute,
    findOpenDisputeForAttendance,
    findDisputesByEmployee,
    findDisputesByAttendanceIds,
} = require("../models/use-cases/attendanceDispute");
const {
    createLateArrivalLeave,
    getAvailableLeavesForEmployee,
    createUserLeaveApplication,
    findLeavesByEmployee,
    findLeaveByIdForEmployee,
    cancelUserLeave,
    findExistingLeave,
} = require("../models/use-cases/leaveApplication");
const Holiday = require("../models/entities/holiyDay");
const { getHolidaysPaginated } = require("../models/use-cases/holiyDay");
const { calculateWorkingLeaveDays } = require("../services/leaveApplication");
const {
    createDocumentRequest,
    findOpenRequest,
    findActiveRequestsByUser,
} = require("../models/use-cases/documentRequest");
const { addEmployeeDocument } = require("../models/use-cases/documents");
const CorporateUser = require("../models/entities/corporateUser");
const { fetchExternalFile } = require('../utils/safeFetch');
const Salary = require("../models/entities/salary");
const { downloadPayslip } = require("../services/salary");
const { findPayslipsForEmployee } = require("../models/use-cases/salary");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { formatNumberWithLocalString } = require("../utils/formatter");
const { humanReadableDate } = require("../utils/dateUtils");
const {
    reimbursementRequestToCorporateTemplate,
    reimbursementRequestToEmployeeTemplate,
} = require("../utils/email/emailTemplates/reimbursement");
const {
    leaveRequestToCorporateTemplate,
    leaveRequestToEmployeeTemplate,
} = require("../utils/email/emailTemplates/leaveRequest");
const { overtimeRequestToCorporateTemplate } = require("../utils/email/emailTemplates/overtime");
const {
    disputeReceived,
    disputeRaisedToCorporateTemplate,
} = require("../utils/email/emailTemplates/attendanceDispute");
const { documentRequestToCorporateTemplate } = require("../utils/email/emailTemplates/documentRequestToCorporate");

const REIMBURSEMENT_STATUS_VALUES = ['requestedByEmployee', 'approved', 'rejected', 'cancelledByEmployee'];
const OVERTIME_STATUS_VALUES = ['requestedByEmployee', 'approved', 'rejected', 'cancelledByEmployee'];

// Frontend base URL for the CTA buttons inside request-notification emails —
// same env-driven pattern already used by services/paymentLinks.js.
const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;
const CORPORATE_REIMBURSEMENT_REVIEW_PATH = "/payroll/employee-reimbursements";
const EMPLOYEE_REIMBURSEMENT_PATH = "/employee/reimbursements";
const CORPORATE_LEAVE_REVIEW_PATH = "/payroll/employee-Leaves?tab=2";
const EMPLOYEE_LEAVE_PATH = "/employee/leaves";
const CORPORATE_OVERTIME_REVIEW_PATH = "/payroll/employees";
const CORPORATE_DISPUTE_REVIEW_PATH = "/payroll/timesheet";
const EMPLOYEE_ATTENDANCE_PATH = "/employee/attendance";
const DISPUTE_SUBJECT_LABEL = { late: "Late Arrival Dispute", absent: "Absence Dispute" };
const CORPORATE_DOCUMENT_REVIEW_PATH = "/payroll/all-documents";

// Email both the corporate/HR admin and the employee when an employee raises a
// reimbursement request from ESS. Best-effort: a failure here must never fail
// the employee's request.
async function emailReimbursementRequest(req, corporateUserId, employee, reimbursement, logTraceId) {
    try {
        const hrSettings = await findOneHrSettings(corporateUserId);
        const corporateUser = hrSettings?.corporateUser;
        if (!corporateUser) return;

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

        const employeeName = employee?.personalInformation?.fullName;
        const reason = reimbursement?.expenseDetails;
        const amount = reimbursement?.totalPay !== undefined && reimbursement?.totalPay !== null
            ? `₹${formatNumberWithLocalString(reimbursement.totalPay)}`
            : null;
        const partnerId = req.user?.registeredBy || null;

        const corporateResolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.REIMBURSEMENT_REQUEST_TO_CORPORATE,
            variables: {
                adminName: companyName || 'Team',
                employeeName: employeeName || 'an employee',
                reason: reason || '',
                amount: amount || '',
                reviewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_REIMBURSEMENT_REVIEW_PATH}` : '',
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: `New Reimbursement Request - ${employeeName || 'an employee'}`,
            fallbackHtml: reimbursementRequestToCorporateTemplate({
                adminName: companyName,
                employeeName,
                reason,
                amount,
                reviewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_REIMBURSEMENT_REVIEW_PATH}` : '',
            }, branding),
            partnerId,
        });
        if (corporateUser.email) {
            const corporateEmailResponse = await emailer.email(corporateUser.email, corporateResolved.subject, corporateResolved.html);
            if (!corporateEmailResponse?.status) {
                customLog(logTraceId, "error", { message: "Failed to send reimbursement request email to corporate", error: corporateEmailResponse?.message });
            }
        }

        const employeeResolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.REIMBURSEMENT_REQUEST_TO_EMPLOYEE,
            variables: {
                employeeName: employeeName || 'Employee',
                reason: reason || '',
                amount: amount || '',
                viewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_REIMBURSEMENT_PATH}` : '',
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: 'Reimbursement Request Received',
            fallbackHtml: reimbursementRequestToEmployeeTemplate({
                employeeName,
                reason,
                amount,
                viewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_REIMBURSEMENT_PATH}` : '',
            }, branding),
            partnerId,
        });
        const employeeEmail = employee?.personalInformation?.email;
        if (employeeEmail) {
            const employeeEmailResponse = await emailer.email(employeeEmail, employeeResolved.subject, employeeResolved.html);
            if (!employeeEmailResponse?.status) {
                customLog(logTraceId, "error", { message: "Failed to send reimbursement request confirmation to employee", error: employeeEmailResponse?.message });
            }
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to email reimbursement request notifications", error: error?.message });
    }
}

// Email both the corporate/HR admin and the employee when an employee applies for
// leave from ESS. Best-effort: a failure here must never fail the request.
async function emailLeaveRequest(req, corporateUserId, employee, leave, leaveTypeLabel, logTraceId) {
    try {
        const hrSettings = await findOneHrSettings(corporateUserId);
        const corporateUser = hrSettings?.corporateUser;
        if (!corporateUser) return;

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

        const employeeName = employee?.personalInformation?.fullName;
        const start = humanReadableDate(leave.start);
        const end = humanReadableDate(leave.end);
        const reason = leave.notes;
        const partnerId = req.user?.registeredBy || null;
        const shared = { employeeName, organizationName: companyName, leaveType: leaveTypeLabel, start, end, reason };

        const corporateResolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_REQUEST_TO_CORPORATE,
            variables: {
                adminName: companyName || 'Team',
                employeeName: employeeName || 'an employee',
                leaveType: leaveTypeLabel || '',
                start, end,
                reason: reason || '',
                reviewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_LEAVE_REVIEW_PATH}` : '',
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: `New Leave Request - ${employeeName || 'an employee'}`,
            fallbackHtml: leaveRequestToCorporateTemplate({
                adminName: companyName,
                ...shared,
                reviewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_LEAVE_REVIEW_PATH}` : '',
            }, branding),
            partnerId,
        });
        if (corporateUser.email) {
            const corporateEmailResponse = await emailer.email(corporateUser.email, corporateResolved.subject, corporateResolved.html);
            if (!corporateEmailResponse?.status) {
                customLog(logTraceId, "error", { message: "Failed to send leave request email to corporate", error: corporateEmailResponse?.message });
            }
        }

        const employeeResolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_REQUEST_TO_EMPLOYEE,
            variables: {
                employeeName: employeeName || 'Employee',
                leaveType: leaveTypeLabel || '',
                start, end,
                reason: reason || '',
                leaveCount: leave.leaveCount,
                halfDaySelection: leave.halfDaySelection,
                hasSupportingDoc: false,
                viewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_LEAVE_PATH}` : '',
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: 'Leave Request Submitted',
            fallbackHtml: leaveRequestToEmployeeTemplate({
                ...shared,
                leaveCount: leave.leaveCount,
                halfDaySelection: leave.halfDaySelection,
                hasSupportingDoc: false,
                viewUrl: FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_LEAVE_PATH}` : '',
            }, branding),
            partnerId,
        });
        const employeeEmail = employee?.personalInformation?.email;
        if (employeeEmail) {
            const employeeEmailResponse = await emailer.email(employeeEmail, employeeResolved.subject, employeeResolved.html);
            if (!employeeEmailResponse?.status) {
                customLog(logTraceId, "error", { message: "Failed to send leave request confirmation to employee", error: employeeEmailResponse?.message });
            }
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to email leave request notifications", error: error?.message });
    }
}

// Email the corporate/HR admin when an employee raises an overtime request from
// ESS. Best-effort: a failure here must never fail the request.
async function emailOvertimeRequest(req, corporateUserId, employee, overtime, logTraceId) {
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

        const employeeName = employee?.personalInformation?.fullName;
        const overtimeDate = overtime.overTimeDate ? humanReadableDate(overtime.overTimeDate) : null;
        const reviewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_OVERTIME_REVIEW_PATH}` : '';

        const resolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.OVERTIME_REQUEST_TO_CORPORATE,
            variables: {
                adminName: companyName || 'Team',
                employeeName: employeeName || 'an employee',
                overtimeDate: overtimeDate || '',
                overtimeHours: overtime.extraHours,
                reason: overtime.notes || '',
                reviewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: `New Overtime Request - ${employeeName || 'an employee'}`,
            fallbackHtml: overtimeRequestToCorporateTemplate({
                adminName: companyName,
                employeeName,
                overtimeDate,
                overtimeHours: overtime.extraHours,
                reason: overtime.notes,
                reviewUrl,
            }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(corporateUser.email, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send overtime request notification", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to email overtime request notification", error: error?.message });
    }
}

// Confirm to the employee that their attendance dispute was received, and notify
// the corporate/HR admin. Best-effort: a failure here must never fail the request.
async function emailDisputeRaised(req, corporateUserId, employee, dispute, attendanceDate, logTraceId) {
    try {
        const hrSettings = await findOneHrSettings(corporateUserId);
        const corporateUser = hrSettings?.corporateUser;
        if (!corporateUser) return;

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

        const employeeName = employee?.personalInformation?.fullName;
        const formattedDate = attendanceDate ? humanReadableDate(attendanceDate) : null;
        const disputeSubject = DISPUTE_SUBJECT_LABEL[dispute.disputeType] || "Attendance Dispute";
        const disputeDate = humanReadableDate(dispute.createdAt);
        const partnerId = req.user?.registeredBy || null;

        const employeeEmail = employee?.personalInformation?.email;
        if (employeeEmail) {
            const employeeViewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_ATTENDANCE_PATH}` : '';
            const employeeResolved = await resolveDynamicEmail({
                req,
                key: PAYROLL_EMAIL_TEMPLATE_KEYS.DISPUTE_RECEIVED,
                variables: {
                    employeeName: employeeName || 'Employee',
                    organizationName: companyName || 'Peko',
                    disputeSubject,
                    disputeReason: dispute.reason || '',
                    disputeDate,
                    ctaUrl: employeeViewUrl,
                    ...v2LayoutVariables(branding),
                },
                fallbackSubject: disputeSubject,
                fallbackHtml: disputeReceived({
                    companyName,
                    employeeName,
                    disputeSubject,
                    disputeReason: dispute.reason,
                    disputeDate,
                    viewUrl: employeeViewUrl,
                }, branding),
                partnerId,
            });
            const response = await emailer.email(employeeEmail, employeeResolved.subject, employeeResolved.html);
            if (!response?.status) {
                customLog(logTraceId, "error", { message: "Failed to send dispute received email to employee", error: response?.message });
            }
        }

        if (corporateUser.email) {
            const corporateReviewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_DISPUTE_REVIEW_PATH}` : '';
            const corporateResolved = await resolveDynamicEmail({
                req,
                key: PAYROLL_EMAIL_TEMPLATE_KEYS.DISPUTE_RAISED_TO_CORPORATE,
                variables: {
                    adminName: companyName || 'Team',
                    employeeName: employeeName || 'an employee',
                    disputeDate: formattedDate || '',
                    disputeReason: dispute.reason || '',
                    reviewUrl: corporateReviewUrl,
                    ...v2LayoutVariables(branding),
                },
                fallbackSubject: `Attendance Dispute Raised - ${employeeName || 'an employee'}`,
                fallbackHtml: disputeRaisedToCorporateTemplate({
                    adminName: companyName,
                    employeeName,
                    disputeDate: formattedDate,
                    disputeReason: dispute.reason,
                    reviewUrl: corporateReviewUrl,
                }, branding),
                partnerId,
            });
            const response = await emailer.email(corporateUser.email, corporateResolved.subject, corporateResolved.html);
            if (!response?.status) {
                customLog(logTraceId, "error", { message: "Failed to send dispute raised email to corporate", error: response?.message });
            }
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to email attendance dispute notifications", error: error?.message });
    }
}

// Email the corporate/HR admin when an employee requests a document from ESS.
// Best-effort: a failure here must never fail the employee's request.
async function emailDocumentRequest(req, corporateUserId, employee, documentType, logTraceId) {
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
        const employeeName = employee?.personalInformation?.fullName;
        const reviewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${CORPORATE_DOCUMENT_REVIEW_PATH}` : '';

        const resolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.DOCUMENT_REQUEST_TO_CORPORATE,
            variables: {
                adminName: companyName || 'Team',
                employeeName: employeeName || 'an employee',
                documentType: documentType || '',
                reviewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: `New Document Request - ${employeeName || 'an employee'}`,
            fallbackHtml: documentRequestToCorporateTemplate({
                adminName: companyName,
                employeeName,
                documentType,
                reviewUrl,
            }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(corporateUser.email, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send document request notification", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to email document request notification", error: error?.message });
    }
}

// Employee Self-Service: the employee's own read-only profile view.
// Lazily marks isEss=true the first time the employee actually opens their ESS profile.
exports.getEssProfile = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    // employeeId is the specific Mongo _id assigned to this ESS account at invite time —
    // it already uniquely identifies the employee, so no separate corporateUser filter is needed.
    const employee = await Employee.findOne({
        _id: employeeId,
        isEmployeeDeleted: false,
    }).populate("employeeInformation.department");

    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: 'Employee profile not found',
            data: {},
        });
    }

    if (!employee.isEss) {
        employee.isEss = true;
        await employee.save();
    }

    // Resolve the corporate ref to its company name for the payslip's Company field.
    if (employee.corporateUser) {
        await employee.populate("corporateUser", "companyName");
    }

    // Bank details live in a separate collection (keyed by employeeId), unlike
    // AE where they're embedded on the employee document.
    const bankDetails = await BankDetails.findOne({ employeeId });

    // Lets the profile page disable the Request buttons while HR hasn't yet
    // approved/rejected the employee's last request.
    const [profileRequest, bankRequest] = await Promise.all([
        findOpenRequestByType(employee.corporateUser, employeeId, 'profileDetails'),
        findOpenRequestByType(employee.corporateUser, employeeId, 'bankDetails'),
    ]);

    // reportingStaff has no schema ref, so resolve the name manually.
    let reportingStaffName = null;
    if (employee.employeeInformation?.reportingStaff) {
        const reportingStaff = await Employee.findOne(
            { _id: employee.employeeInformation.reportingStaff },
            'personalInformation.fullName'
        );
        reportingStaffName = reportingStaff?.personalInformation?.fullName || null;
    }

    const employeeJson = employee.toJSON();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Employee profile fetched successfully',
        data: {
            employee: {
                ...employeeJson,
                employeeInformation: {
                    ...employeeJson.employeeInformation,
                    reportingStaffName,
                },
                bankDetails: bankDetails || null,
                profileUpdateRequestPending: !!profileRequest,
                bankUpdateRequestPending: !!bankRequest,
            },
        },
    });
});

// Submits a profile-update request for HR review; does not change the live employee record.
exports.requestProfileUpdate = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const {
        mobileNumber, addressLine1, addressLine2, state, country, pinCode,
        emergencyContactName, emergencyContactPhone,
    } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const existingOpenRequest = await findOpenRequestByType(employee.corporateUser, employeeId, 'profileDetails');
    if (existingOpenRequest) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'A profile update request is already in progress', data: {} });
    }

    const personal = employee.personalInformation || {};
    const request = await createProfileUpdateRequest({
        corporateUser: employee.corporateUser,
        employee: employeeId,
        userId: req.user.id,
        type: 'profileDetails',
        requestedData: { mobileNumber, addressLine1, addressLine2, state, country, pinCode, emergencyContactName, emergencyContactPhone },
        currentData: {
            mobileNumber: personal.mobileNo,
            addressLine1: personal.addressLine1,
            addressLine2: personal.addressLine2,
            state: personal.state,
            country: personal.country,
            pinCode: personal.pinCode,
            emergencyContactName: personal.emergencyContactName,
            emergencyContactPhone: personal.emergencyContactNo,
        },
        status: 'requestedByEmployee',
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Profile update request submitted successfully',
        data: request,
    });
});

// Submits a bank-update request for HR review; does not change the live bank details record.
exports.requestBankUpdate = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { bankName, ifscCode, accountNumber } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const existingOpenRequest = await findOpenRequestByType(employee.corporateUser, employeeId, 'bankDetails');
    if (existingOpenRequest) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'A bank update request is already in progress', data: {} });
    }

    const currentBankDetails = await BankDetails.findOne({ employeeId, isDefaultAccount: true });
    const request = await createProfileUpdateRequest({
        corporateUser: employee.corporateUser,
        employee: employeeId,
        userId: req.user.id,
        type: 'bankDetails',
        requestedData: { bankName, ifscCode, accountNumber },
        currentData: {
            bankName: currentBankDetails?.bankName,
            ifscCode: currentBankDetails?.ifscCode,
            accountNumber: currentBankDetails?.accountNumber,
        },
        status: 'requestedByEmployee',
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Bank update request submitted successfully',
        data: request,
    });
});

// Announcements visible to the logged-in employee: MAILED ones for their
// corporate that don't exclude them, within an optional date window (defaults
// to the last month -> today, since createdAt is the delivery date, not a
// stored expiry field).
exports.listAnnouncements = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const to = req.query.to ? new Date(req.query.to) : new Date();
    const from = req.query.from
        ? new Date(req.query.from)
        : (() => {
              const d = new Date(to);
              d.setMonth(d.getMonth() - 1);
              return d;
          })();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const { announcements, total } = await getAnnouncementsForUser({
        corporateUser: employee.corporateUser,
        employeeId,
        from,
        to,
        page,
        limit,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved announcements',
        data: { announcements, total, page, limit, filters: { from, to } },
    });
});

// Submits a reimbursement claim for HR review. transferMethod is always SALARY —
// matching the same silent default IN's HR-create flow already uses (the
// employee/HR are never asked to pick a transfer method through any UI).
exports.requestReimbursement = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { amount, expenseDate, expenseDetails, supportingDocs } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const joiningDate = employee?.employeeInformation?.dateOfJoin;
    if (joiningDate && expenseDate) {
        const startOfDay = d => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; };
        if (startOfDay(expenseDate) < startOfDay(joiningDate)) {
            return res.status(400).json({ status: false, responseCode: '001', message: 'Reimbursement date cannot be before your joining date.', data: {} });
        }
    }

    const request = await createReimbursementRequest({
        corporateUser: employee.corporateUser,
        employee: employeeId,
        expenseDate,
        totalPay: amount,
        expenseDetails,
        supportingDocs,
        transferMethod: 'SALARY',
        status: 'requestedByEmployee',
    });

    await emailReimbursementRequest(req, employee.corporateUser, employee, request, req?.LogTraceId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Reimbursement request submitted successfully',
        data: request,
    });
});

// Lists the logged-in employee's own reimbursement claims.
exports.listReimbursement = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const { status } = req.query;
    if (status && status !== 'all' && !REIMBURSEMENT_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Invalid status filter', data: {} });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const from = req.query.from ? new Date(req.query.from) : undefined;
    const to = req.query.to ? new Date(req.query.to) : undefined;

    const { records, total } = await findReimbursementByEmployee(employee.corporateUser, employeeId, {
        status, from, to, page, limit,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved reimbursement requests',
        data: { records, total, page, limit },
    });
});

// Cancels a still-pending reimbursement claim. Anything HR has already acted on is locked.
exports.cancelReimbursement = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { reimbursementId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const record = await findReimbursementByIdForEmployee(employee.corporateUser, employeeId, reimbursementId);
    if (!record) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Reimbursement request not found', data: {} });
    }
    if (record.status !== 'requestedByEmployee') {
        return res.status(400).json({ status: false, responseCode: '001', message: `This reimbursement request cannot be cancelled (status: ${record.status})`, data: {} });
    }

    const updated = await cancelReimbursementRequest(employee.corporateUser, employeeId, reimbursementId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Reimbursement request cancelled successfully',
        data: updated,
    });
});

// Compute the shift start Date for `now`'s calendar day from an
// employeeInformation.timeSchedule string like "9:00 AM - 6:00 PM".
// Returns null when unset/unparseable — callers then skip late detection.
const getShiftStart = (timeSchedule, now) => {
    if (!timeSchedule || typeof timeSchedule !== 'string') return null;
    const startStr = timeSchedule.split(' - ')[0]?.trim();
    if (!startStr) return null;

    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const shiftStart = new Date(`${mm}/${dd}/${now.getFullYear()} ${startStr}`);
    return isNaN(shiftStart.getTime()) ? null : shiftStart;
};

// Whether the logged-in employee's corporate allows ESS check-in/check-out.
// Lets the portal show/hide the check-in button. Defaults to enabled.
exports.getCheckInOutStatus = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const hrSettings = await HrSettings.findOne({ corporateUser: employee.corporateUser });
    const checkInOutEnabled = hrSettings?.checkInOutEnabled ?? true;

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved check-in/out status',
        data: { checkInOutEnabled },
    });
});

// Whether the logged-in employee can check in right now.
// isCheckInAvailable is false when check-in/out is disabled for the corporate,
// or the employee has already checked in today.
exports.getCheckInAvailability = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    let isCheckInAvailable = true;
    let reason = null;

    const hrSettings = await HrSettings.findOne({ corporateUser });
    const checkInOutEnabled = hrSettings?.checkInOutEnabled ?? true;
    if (!checkInOutEnabled) {
        isCheckInAvailable = false;
        reason = 'Check-in/check-out is disabled by your organization';
    }

    if (isCheckInAvailable) {
        const existing = await findAttendanceForDay(corporateUser, employeeId, dayStart);
        if (existing && existing.checkIn && existing.checkIn.time) {
            isCheckInAvailable = false;
            reason = 'You have already checked in today';
        }
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved check-in availability',
        data: { isCheckInAvailable, reason },
    });
});

// Check in the logged-in employee for the current day.
exports.checkIn = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const hrSettings = await HrSettings.findOne({ corporateUser });
    if (hrSettings && hrSettings.checkInOutEnabled === false) {
        return res.status(403).json({ status: false, responseCode: '001', message: 'Check-in/check-out is disabled by your organization', data: {} });
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const existing = await findAttendanceForDay(corporateUser, employeeId, dayStart);
    if (existing && existing.checkIn && existing.checkIn.time) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'You have already checked in today', data: {} });
    }

    const { checkIn = {}, notes } = req.body;
    const { lat, lng } = checkIn;

    // Determine on-time vs late from the employee's shift start, tolerating the
    // corporate's configured grace period before counting minutes as late.
    let status = 'present';
    let lateMinutes = 0;
    const shiftStart = getShiftStart(employee.employeeInformation?.timeSchedule, now)
        || (hrSettings?.defaultWorkSchedule?.checkInTime
            ? getShiftStart(`${hrSettings.defaultWorkSchedule.checkInTime} - ${hrSettings.defaultWorkSchedule.checkOutTime}`, now)
            : null);
    if (shiftStart) {
        const gracePeriodMinutes = hrSettings?.gracePeriodMinutes || 0;
        const graceDeadline = new Date(shiftStart.getTime() + gracePeriodMinutes * 60000);
        if (now > graceDeadline) {
            status = 'late';
            lateMinutes = Math.round((now - shiftStart) / 60000);
        }
    }

    const record = await upsertCheckIn(
        corporateUser,
        employeeId,
        dayStart,
        { time: now, lat, lng, method: 'ess' },
        { status, lateMinutes, ...(notes ? { notes } : {}) }
    );

    // Late Arrival Policy: auto-cut a 0.5-day leave on a late check-in.
    if (status === 'late') {
        await createLateArrivalLeave(corporateUser, employeeId, dayStart);
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: status === 'late' ? 'Checked in — marked as late arrival' : 'Checked in successfully',
        data: record,
    });
});

// Check out the logged-in employee for the current day.
// Requires an existing check-in for the day; computes totalHours.
exports.checkOut = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const hrSettings = await HrSettings.findOne({ corporateUser });
    if (hrSettings && hrSettings.checkInOutEnabled === false) {
        return res.status(403).json({ status: false, responseCode: '001', message: 'Check-in/check-out is disabled by your organization', data: {} });
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const existing = await findAttendanceForDay(corporateUser, employeeId, dayStart);
    if (!existing || !existing.checkIn || !existing.checkIn.time) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'You have not checked in today', data: {} });
    }
    if (existing.checkOut && existing.checkOut.time) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'You have already checked out today', data: {} });
    }

    const { checkOut = {}, notes } = req.body;
    const { lat, lng } = checkOut;

    const totalHours = Number(
        ((now - new Date(existing.checkIn.time)) / (1000 * 60 * 60)).toFixed(2)
    );

    const record = await recordCheckOut(
        corporateUser,
        employeeId,
        dayStart,
        { time: now, lat, lng },
        { totalHours, ...(notes ? { notes } : {}) }
    );

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Checked out successfully',
        data: record,
    });
});

// Monthly attendance metrics for the logged-in employee:
// total check-ins, total late arrivals, total leaves.
// Defaults to the current month; optional ?month=YYYY-MM.
// Accepts `month` (YYYY-MM, Dashboard widget) or `from`/`to` (Attendance page); defaults to all-time since joining if neither is given.
exports.getAttendanceMetrics = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    let monthStart, monthEnd;

    if (req.query.month) {
        const m = /^(\d{4})-(\d{2})$/.exec(req.query.month);
        if (!m) {
            return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'month'. Expected format YYYY-MM", data: {} });
        }
        const year = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        if (month < 0 || month > 11) {
            return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'month'. Month must be 01-12", data: {} });
        }
        monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else {
        monthEnd = req.query.to ? new Date(req.query.to) : new Date();
        if (isNaN(monthEnd.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
        monthEnd.setHours(23, 59, 59, 999);

        if (req.query.from) {
            monthStart = new Date(req.query.from);
            if (isNaN(monthStart.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
        } else {
            monthStart = employee.employeeInformation?.dateOfJoin ? new Date(employee.employeeInformation.dateOfJoin) : new Date(0);
        }
        monthStart.setHours(0, 0, 0, 0);
    }

    const metrics = await getMonthlyMetrics(corporateUser, employeeId, monthStart, monthEnd);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved attendance metrics',
        data: { ...metrics, month: { from: monthStart, to: monthEnd } },
    });
});

// List the logged-in employee's own attendance records (paginated, newest first).
// Optional query: from, to (ISO dates), status, page, limit.
exports.getAttendanceList = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    let to;
    if (req.query.to) {
        to = new Date(req.query.to);
        if (isNaN(to.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
    } else {
        to = new Date();
    }

    let from;
    if (req.query.from) {
        from = new Date(req.query.from);
        if (isNaN(from.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
    } else {
        // No filter picked — default to all-time since joining, not a rolling window.
        from = employee.employeeInformation?.dateOfJoin ? new Date(employee.employeeInformation.dateOfJoin) : new Date(0);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const ALLOWED_STATUS = ['present', 'late', 'absent', 'on-leave', 'half-day'];
    let status;
    if (req.query.status && req.query.status !== 'all') {
        if (!ALLOWED_STATUS.includes(req.query.status)) {
            return res.status(400).json({ status: false, responseCode: '001', message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}, all`, data: {} });
        }
        status = req.query.status;
    }

    const { records, total } = await findAttendanceList(corporateUser, employeeId, { from, to, status, page, limit });

    // Flag late/absent entries that already have a dispute (latest dispute per attendance record),
    // so the ESS attendance table and the leave deduction log agree on dispute status. Virtual
    // rows (synthesized for days with no real AttendanceRecord) use a "virtual-YYYY-MM-DD" id
    // that was never persisted, so it can never have a dispute against it — exclude those or
    // the $in cast to ObjectId below throws.
    const realRecordIds = records.filter(r => mongoose.Types.ObjectId.isValid(r._id)).map(r => r._id);
    const disputes = await findDisputesByAttendanceIds(corporateUser, employeeId, realRecordIds);
    const disputeByAttendance = {};
    for (const d of disputes) {
        const key = String(d.attendance);
        if (!disputeByAttendance[key]) disputeByAttendance[key] = d; // first = latest (sorted desc)
    }

    const recordsWithDispute = records.map(r => {
        const doc = typeof r.toJSON === 'function' ? r.toJSON() : r;
        const dispute = disputeByAttendance[String(r._id)];
        return {
            ...doc,
            disputeRaised: !!dispute,
            disputeStatus: dispute ? dispute.status : undefined,
        };
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved attendance list',
        data: { records: recordsWithDispute, total, page, limit, filters: { from, to, status: status || 'all' } },
    });
});

// Trim an overtime record to the fields exposed on the employee side.
const formatOvertimeForUser = (doc) => {
    if (!doc) return doc;
    const o = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
    return {
        id: o.id || o._id,
        overTimeDate: o.overTimeDate,
        extraHours: o.extraHours,
        notes: o.notes,
        status: o.status,
        paymentStatus: o.paymentStatus,
    };
};

// Raise an overtime request (hours, date, notes) for HR review.
exports.requestOvertime = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { hours, date, notes } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dateOfJoin = employee.employeeInformation?.dateOfJoin;
    if (dateOfJoin) {
        const joinDayStart = new Date(dateOfJoin);
        joinDayStart.setHours(0, 0, 0, 0);
        if (dayStart < joinDayStart) {
            return res.status(400).json({ status: false, responseCode: '001', message: 'Overtime date cannot be before your joining date', data: {} });
        }
    }

    const existing = await findOpenOvertimeRequestForDate(corporateUser, employeeId, dayStart, dayEnd);
    if (existing) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'An overtime request for this date is already in progress', data: {} });
    }

    const request = await createOvertimeRequest({
        corporateUser,
        employee: employeeId,
        overTimeDate: date,
        extraHours: hours,
        notes,
        status: 'requestedByEmployee',
    });

    await emailOvertimeRequest(req, corporateUser, employee, request, req?.LogTraceId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Overtime request submitted successfully',
        data: formatOvertimeForUser(request),
    });
});

// Lists the logged-in employee's own overtime records (newest first, optional status/date filters).
exports.listOvertime = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    // No date filter by default — show all-time records unless the employee
    // explicitly picks a range.
    let to;
    if (req.query.to) {
        to = new Date(req.query.to);
        if (isNaN(to.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
        to.setHours(23, 59, 59, 999);
    }
    let from;
    if (req.query.from) {
        from = new Date(req.query.from);
        if (isNaN(from.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
        from.setHours(0, 0, 0, 0);
    }

    let status;
    if (req.query.status && req.query.status !== 'all') {
        if (!OVERTIME_STATUS_VALUES.includes(req.query.status)) {
            return res.status(400).json({ status: false, responseCode: '001', message: `Invalid status. Allowed: ${OVERTIME_STATUS_VALUES.join(', ')}, all`, data: {} });
        }
        status = req.query.status;
    }

    const { records, total, summary } = await findOvertimeByEmployee(corporateUser, employeeId, { status, from, to, page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved overtime records',
        data: { records, total, summary, page, limit, filters: { from, to, status: status || 'all' } },
    });
});

// Cancels the logged-in employee's own overtime request (status -> cancelledByEmployee).
exports.cancelOvertime = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { overtimeId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const record = await findOvertimeByIdForEmployee(corporateUser, employeeId, overtimeId);
    if (!record) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Overtime request not found', data: {} });
    }
    if (record.status !== 'requestedByEmployee') {
        return res.status(400).json({ status: false, responseCode: '001', message: `This overtime request cannot be cancelled (status: ${record.status || 'none'})`, data: {} });
    }

    const updated = await cancelOvertimeRequest(corporateUser, employeeId, overtimeId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Overtime request cancelled successfully',
        data: formatOvertimeForUser(updated),
    });
});

// Raise a dispute against a late/absent attendance record.
exports.raiseAttendanceDispute = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { attendanceId, reason, supportingDocs } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    // "virtual-YYYY-MM-DD" ids come from days findAttendanceList synthesized as absent
    // because no real AttendanceRecord exists yet — materialize one so it can be disputed.
    const isVirtual = typeof attendanceId === 'string' && attendanceId.startsWith('virtual-');
    const attendance = isVirtual
        ? await materializeAbsentRecord(corporateUser, employeeId, attendanceId.slice('virtual-'.length))
        : await findAttendanceById(corporateUser, employeeId, attendanceId);
    if (!attendance) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Attendance record not found', data: {} });
    }
    if (!['late', 'absent'].includes(attendance.status)) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Only a late or absent record can be disputed', data: {} });
    }

    const resolvedAttendanceId = attendance._id;

    const existing = await findOpenDisputeForAttendance(corporateUser, employeeId, resolvedAttendanceId);
    if (existing) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'A dispute for this record is already in progress', data: {} });
    }

    const dispute = await createAttendanceDispute({
        corporateUser,
        employee: employeeId,
        userId: req.user.id,
        attendance: resolvedAttendanceId,
        disputeType: attendance.status,
        reason,
        supportingDocs,
        status: 'requestedByEmployee',
    });

    await emailDisputeRaised(req, corporateUser, employee, dispute, attendance.date, req?.LogTraceId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Dispute raised successfully',
        data: dispute,
    });
});

// List the logged-in employee's attendance disputes (newest first, date range + status filter + pagination).
exports.listAttendanceDisputes = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    let to;
    if (req.query.to) {
        to = new Date(req.query.to);
        if (isNaN(to.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
    } else {
        to = new Date();
    }
    let from;
    if (req.query.from) {
        from = new Date(req.query.from);
        if (isNaN(from.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
    } else {
        from = new Date(to);
        from.setMonth(from.getMonth() - 1);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const ALLOWED_STATUS = ['requestedByEmployee', 'approved', 'rejected'];
    let status;
    if (req.query.status && req.query.status !== 'all') {
        if (!ALLOWED_STATUS.includes(req.query.status)) {
            return res.status(400).json({ status: false, responseCode: '001', message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}, all`, data: {} });
        }
        status = req.query.status;
    }

    const { records, total } = await findDisputesByEmployee(corporateUser, employeeId, { status, from, to, page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved attendance disputes',
        data: { records, total, page, limit, filters: { from, to, status: status || 'all' } },
    });
});

const DEDUCTION_TYPE_LABEL = { late: 'Late Arrival', absent: 'Absent' };
const DEDUCTION_DAYS = { late: 0.5, absent: 1 };

// Deduction log: the logged-in employee's own late arrivals + absences, each
// flagged with whether a dispute has already been raised against it.
exports.getDeductionLog = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

    let to;
    if (req.query.to) {
        to = new Date(req.query.to);
        if (isNaN(to.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
    } else {
        to = new Date();
    }
    let from;
    if (req.query.from) {
        from = new Date(req.query.from);
        if (isNaN(from.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
    } else {
        from = new Date(to);
        from.setMonth(from.getMonth() - 1);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const { records, total } = await findDeductionLog(corporateUser, employeeId, { from, to, page, limit });

    // Flag entries that already have a dispute (latest dispute per attendance record).
    const disputes = await findDisputesByAttendanceIds(corporateUser, employeeId, records.map(r => r._id));
    const disputeByAttendance = {};
    for (const d of disputes) {
        const key = String(d.attendance);
        if (!disputeByAttendance[key]) disputeByAttendance[key] = d; // first = latest (sorted desc)
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved deduction log',
        data: {
            records: records.map(r => {
                const dispute = disputeByAttendance[String(r._id)];
                return {
                    id: r._id,
                    date: r.date,
                    type: DEDUCTION_TYPE_LABEL[r.status] ?? r.status,
                    status: r.status,
                    lateMinutes: r.lateMinutes,
                    deduction: DEDUCTION_DAYS[r.status] ?? 0,
                    disputeRaised: !!dispute,
                    disputeStatus: dispute ? dispute.status : undefined,
                };
            }),
            total,
            page,
            limit,
            filters: { from, to },
        },
    });
});

// ESS-facing available leave balance (per configured leave type + unpaid).
exports.getLeaveBalance = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const availableLeaves = await getAvailableLeavesForEmployee(employee.corporateUser, employeeId, employee.personalInformation?.gender);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved leave balance',
        data: { availableLeaves },
    });
});

// Apply for leave (Employee Self-Service). Created with status "applied".
exports.applyLeave = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { start, end, leaveCount, typeOfLeave, isUnpaidLeave, halfDaySelection, notes } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    if (new Date(end) < new Date(start)) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Please ensure that the end date is later than the start date.', data: {} });
    }

    // Block past dates and dates before joining.
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Leave cannot be applied for a past date.', data: {} });
    }
    const joiningDate = employee?.employeeInformation?.dateOfJoin;
    if (joiningDate) {
        const doj = new Date(joiningDate);
        doj.setHours(0, 0, 0, 0);
        if (startDate < doj) {
            return res.status(400).json({ status: false, responseCode: '001', message: 'Leave cannot be applied before your joining date.', data: {} });
        }
    }

    // Block leave that overlaps a company holiday on the start day.
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);
    const holiday = await Holiday.findOne({
        corporateUser,
        start: { $lte: endOfDay },
        end: { $gte: startDate },
    }).select('_id').lean();
    if (holiday) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Leave cannot be applied on a company holiday.', data: {} });
    }

    // Reject overlapping leave for the same period.
    const existingLeave = await findExistingLeave(corporateUser, employeeId, start, end);
    if (existingLeave) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Leave already exists for the specified period.', data: {} });
    }

    // Recompute the day count authoritatively — non-working weekdays and company
    // holidays inside the range must not be counted, so a client-supplied
    // leaveCount cannot be trusted for full-day requests.
    const resolvedLeaveCount = halfDaySelection ? leaveCount : await calculateWorkingLeaveDays(corporateUser, start, end);
    if (resolvedLeaveCount <= 0) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'The selected date range has no working days to apply leave for.', data: {} });
    }

    // Validate the requested days against the available balance.
    let leaveTypeLabel = isUnpaidLeave ? 'Unpaid Leave' : String(typeOfLeave);
    if (!isUnpaidLeave) {
        const availableLeaves = await getAvailableLeavesForEmployee(corporateUser, employeeId, employee.personalInformation?.gender);
        const matching = availableLeaves.find(l => l.value === String(typeOfLeave));
        leaveTypeLabel = matching?.label || leaveTypeLabel;
        const availableCount = matching ? (matching.count === 'Available' ? Infinity : matching.count) : 0;
        if (resolvedLeaveCount > availableCount) {
            return res.status(400).json({
                status: false,
                responseCode: '001',
                message: `Leave cannot be applied. Requested duration exceeds the available ${matching?.label || 'leave'} balance (${availableCount === Infinity ? 'Unlimited' : availableCount} day${availableCount === 1 ? '' : 's'}).`,
                data: {},
            });
        }
    }

    const created = await createUserLeaveApplication(corporateUser, employeeId, {
        start, end, leaveCount: resolvedLeaveCount, typeOfLeave, isUnpaidLeave, halfDaySelection, notes,
    });

    await emailLeaveRequest(req, corporateUser, employee, created, leaveTypeLabel, req?.LogTraceId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave application submitted successfully',
        data: created,
    });
});

// List the logged-in employee's own leave applications.
exports.listLeaveApplications = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    // No default date window: unlike overtime/reimbursements (always for a past
    // date), a leave's start date is usually in the FUTURE — defaulting to
    // "last month to today" would hide the very requests an employee just
    // submitted. Only filter by date when the caller explicitly asks for it.
    let to;
    if (req.query.to) {
        to = new Date(req.query.to);
        if (isNaN(to.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'to' date", data: {} });
        to.setHours(23, 59, 59, 999);
    }
    let from;
    if (req.query.from) {
        from = new Date(req.query.from);
        if (isNaN(from.getTime())) return res.status(400).json({ status: false, responseCode: '001', message: "Invalid 'from' date", data: {} });
        from.setHours(0, 0, 0, 0);
    }

    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const { records: leaves, total } = await findLeavesByEmployee(corporateUser, employeeId, { from, to, status, page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved leave applications',
        data: {
            records: leaves.map(l => ({
                id: l._id,
                start: l.start,
                end: l.end,
                leaveCount: l.leaveCount,
                halfDaySelection: l.halfDaySelection,
                typeOfLeave: l.isUnpaidLeave ? { id: 'UNPAID', leaveType: 'Unpaid Leave' } : l.typeOfLeave,
                status: l.status,
                notes: l.notes,
            })),
            total,
            page,
            limit,
            filters: { from, to },
        },
    });
});

// Cancel the logged-in employee's own leave request (status -> cancelledByEmployee).
exports.cancelLeave = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { leaveId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const leave = await findLeaveByIdForEmployee(corporateUser, employeeId, leaveId);
    if (!leave) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Leave request not found', data: {} });
    }

    if (!['applied', 'approved'].includes(leave.status)) {
        return res.status(400).json({ status: false, responseCode: '001', message: `This leave request cannot be cancelled (status: ${leave.status})`, data: {} });
    }

    const updated = await cancelUserLeave(corporateUser, employeeId, leaveId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Leave request cancelled successfully',
        data: updated,
    });
});

// Public holidays visible to the logged-in employee, scoped to their own corporate account.
// No date range given -> all holidays for the corporate account (matches the "Public Holidays" tab, which has no date filter).
exports.listHolidays = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const { start, end, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const { holidays, total } = await getHolidaysPaginated(employee.corporateUser, { start, end, category, page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved holidays',
        data: {
            holidays: holidays.map(h => ({
                id: h._id,
                start: h.start,
                end: h.end,
                title: h.title,
                category: h.category,
            })),
            total,
            page,
            limit,
        },
    });
});

// Raises a request for HR to fulfil (e.g. Salary Certificate, Bank Letter).
// Blocks a second open request of the same document type.
exports.requestDocument = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { documentType, purpose } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUser = employee.corporateUser;

    const openRequest = await findOpenRequest(corporateUser, employeeId, documentType);
    if (openRequest) {
        return res.status(400).json({ status: false, responseCode: '001', message: `A request for '${documentType}' is already in progress`, data: {} });
    }

    const request = await createDocumentRequest({
        corporateUser,
        employee: employeeId,
        userId: req.user.id,
        documentType,
        purpose,
        status: 'pending',
    });

    await emailDocumentRequest(req, corporateUser, employee, documentType, req?.LogTraceId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Document request submitted successfully',
        data: request,
    });
});

// Employee's own request list — pending/in-progress only, matching AE: once
// HR fulfils a request it drops out of this list; the employee is notified
// only by the fulfillment email, not in-app.
exports.listActiveDocumentRequests = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const { records, total } = await findActiveRequestsByUser(employee.corporateUser, employeeId, { page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved document requests',
        data: {
            requests: records.map(r => ({
                id: r._id,
                documentType: r.documentType,
                status: r.status,
            })),
            total,
            page,
            limit,
        },
    });
});

// Employee adding a document to their own profile — pushes into the same
// employeeDocuments array corporate CRUD and onboarding already use, so it
// shows up immediately in "My Documents".
exports.uploadUserDocument = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;
    const { name, holderName, expiryDate, url } = req.body;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const updatedEmployee = await addEmployeeDocument(employeeId, employee.corporateUser, {
        name,
        holderName,
        expiryDate,
        url,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Document uploaded successfully',
        data: updatedEmployee,
    });
});

// "My Pay": one row per month for the requested year (defaults to current year).
exports.listMyPayslips = asyncHandler(async (req, res) => {
    const employeeId = req.user._id;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const year = req.query.year || new Date().getFullYear();
    const rows = await findPayslipsForEmployee(employee.corporateUser, employeeId, year);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved payslips',
        data: { rows },
    });
});

// Streams the generated payslip PDF for one of the employee's own, already-
// processed salary records. Reuses the same downloadPayslip/generatePdfFile
// pipeline the corporate "download payslip" feature already uses, unchanged.
exports.downloadMyPayslip = asyncHandler(async (req, res, next) => {
    const employeeId = req.user._id;
    const { salaryId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const corporateUserID = employee.corporateUser;

    const salaryRecord = await Salary.findOne({ _id: salaryId, employee: employeeId, corporateUser: corporateUserID }).select('month year');
    if (!salaryRecord) {
        return next(new ErrorResponse('Payslip not found', 404));
    }

    const corporateUser = await CorporateUser.findById(corporateUserID);
    const companyInfo = {
        logo: corporateUser?.logo,
        companyName: corporateUser?.companyName,
        email: corporateUser?.email,
        website: corporateUser?.website,
        address: `${corporateUser?.city || ''} ${corporateUser?.country || ''}`.trim(),
    };

    const { status, message, data } = await downloadPayslip({
        corporateUserID,
        employeeId,
        companyInfo,
        month: salaryRecord.month,
        year: salaryRecord.year,
    });
    if (!status) {
        return next(new ErrorResponse(message, 400));
    }

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${data.filename}.pdf"`);
    return res.send(data.pdfData);
});

exports.downloadEmployeeDocument = asyncHandler(async (req, res, next) => {
    const employeeId = req.user._id;
    const { documentId } = req.params;

    const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
    if (!employee) {
        return res.status(404).json({ status: false, responseCode: '001', message: 'Employee profile not found', data: {} });
    }

    const doc = employee.employeeDocuments.id(documentId);
    if (!doc || !doc.url) {
        return next(new ErrorResponse('Document not found', 404));
    }

    const response = await fetchExternalFile(doc.url);
    const extension = doc.url.split('.').pop().split(/[?#]/)[0] || 'pdf';
    const name = (doc.name || 'Document').replace(/[^\x20-\x7E]/g, '').replace(/["\\]/g, '').trim() || 'Document';

    res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${name}.${extension}"`);
    return res.send(response.data);
});

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/error-response');
const {
    findProfileRequestsByCorporate,
    findProfileRequestByIdForCorporate,
    findProfileRequestDetailForCorporate,
    updateProfileRequestStatus,
} = require('../models/use-cases/profileUpdateRequest');
const {
    updateEmployeeProfileFields,
    updateApprovedBankDetails,
} = require('../models/use-cases/onboarding');
const Employee = require('../models/entities/employee');
const emailer = require('../utils/email/emailer');
const { customLog } = require('../utils/loggerHelper');
const { findOneHrSettings } = require('../models/use-cases/hrSettings');
const { fetchPartnerBranding } = require('../services/partnerDetailsResolver');
const { resolveDynamicEmail } = require('../services/emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { profileUpdateApproved } = require('../utils/email/emailTemplates/profileUpdateApproved');

const EMPLOYEE_PROFILE_PATH = "/employee/profile";
const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

// Notify the employee that their profile/bank update request was approved and applied.
// Best-effort: a mail failure must never fail the approval.
async function emailProfileUpdateApproved({ req, corporateUserId, employeeId, updatedFields, logTraceId }) {
    try {
        const employee = await Employee.findOne({ _id: employeeId, isEmployeeDeleted: false });
        const to = employee?.personalInformation?.email;
        if (!to) {
            customLog(logTraceId, "info", { message: "No email found for employee; skipped profile-update-approved email" });
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
        const viewUrl = FRONTEND_BASE_URL ? `${FRONTEND_BASE_URL}${EMPLOYEE_PROFILE_PATH}` : '';

        const resolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.PROFILE_UPDATE_APPROVED,
            variables: {
                employeeName: employeeName || 'Employee',
                organizationName: companyName || 'Peko',
                detailLinesHtml: updatedFields ? `Field(s) updated: ${updatedFields}` : '',
                ctaUrl: viewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: 'Your Profile Update Request Has Been Approved',
            fallbackHtml: profileUpdateApproved({
                companyName,
                employeeName,
                updatedFields,
                viewUrl,
            }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(to, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send profile-update-approved email", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to send profile-update-approved email", error: error?.message });
    }
}

const TYPE_LABELS = { profileDetails: 'Profile Details', bankDetails: 'Bank Details' };
const STATUS_VALUES = ['requestedByEmployee', 'approved', 'rejected'];
const TYPE_VALUES = ['profileDetails', 'bankDetails'];

// Maps the ESS-facing request payload onto real Employee-schema personalInformation.* keys.
const buildProfileFieldsUpdate = (requestedData = {}) => {
    const {
        mobileNumber, addressLine1, addressLine2, state, country, pinCode,
        emergencyContactName, emergencyContactPhone,
    } = requestedData;
    const fields = {};
    if (mobileNumber !== undefined) fields.mobileNo = mobileNumber;
    if (addressLine1 !== undefined) fields.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) fields.addressLine2 = addressLine2;
    if (state !== undefined) fields.state = state;
    if (country !== undefined) fields.country = country;
    if (pinCode !== undefined) fields.pinCode = pinCode;
    if (emergencyContactName !== undefined) fields.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) fields.emergencyContactNo = emergencyContactPhone;
    return fields;
};

// Maps the ESS-facing bank payload onto real BankDetails-schema keys.
const buildBankFieldsUpdate = (requestedData = {}) => {
    const { bankName, ifscCode, accountNumber } = requestedData;
    const fields = {};
    if (bankName !== undefined) fields.bankName = bankName;
    if (ifscCode !== undefined) fields.ifscCode = ifscCode;
    if (accountNumber !== undefined) fields.accountNumber = accountNumber;
    return fields;
};

exports.listAllProfileUpdateRequestsForCorporate = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const { status, type, searchText } = req.query;

    if (status && status !== 'all' && !STATUS_VALUES.includes(status)) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Invalid status filter', data: {} });
    }
    if (type && type !== 'all' && !TYPE_VALUES.includes(type)) {
        return res.status(400).json({ status: false, responseCode: '001', message: 'Invalid type filter', data: {} });
    }

    const { records, total, pendingCount } = await findProfileRequestsByCorporate(corporateUser, { type, status, page, limit, searchText });

    const mapped = records.map(r => {
        const json = r.toJSON();
        const employee = json.employee || {};
        return {
            ...json,
            employee: {
                _id: employee.id,
                id: employee.id,
                fullName: employee.personalInformation?.fullName,
                employeeId: employee.employeeInformation?.employeeId,
                designation: employee.employeeInformation?.designation,
            },
            typeLabel: TYPE_LABELS[json.type] || json.type,
        };
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Profile update requests fetched successfully',
        data: { records: mapped, total, pendingCount, page, limit, filters: { status, type } },
    });
});

exports.getProfileUpdateRequestDetail = asyncHandler(async (req, res, next) => {
    const corporateUser = req.user._id;
    const { requestId } = req.params;

    const request = await findProfileRequestDetailForCorporate(corporateUser, requestId);
    if (!request) return next(new ErrorResponse('Profile update request not found', 404));

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Profile update request fetched successfully',
        data: request,
    });
});

exports.approveProfileUpdateRequest = asyncHandler(async (req, res, next) => {
    const corporateUser = req.user._id;
    const { requestId } = req.params;
    const { remarks } = req.body;

    const request = await findProfileRequestByIdForCorporate(corporateUser, requestId);
    if (!request) return next(new ErrorResponse('Profile update request not found', 404));
    if (request.status !== 'requestedByEmployee') {
        return next(new ErrorResponse(`Request already ${request.status}`, 400));
    }

    const isBank = request.type === 'bankDetails';
    const updatePayload = isBank
        ? buildBankFieldsUpdate(request.requestedData)
        : buildProfileFieldsUpdate(request.requestedData);

    if (Object.keys(updatePayload).length === 0) {
        return next(new ErrorResponse('No valid fields to apply from this request', 400));
    }

    const updated = isBank
        ? await updateApprovedBankDetails(request.employee, corporateUser, updatePayload)
        : await updateEmployeeProfileFields(request.employee, updatePayload);

    if (!updated) return next(new ErrorResponse('Employee profile not found', 404));

    const result = await updateProfileRequestStatus(corporateUser, requestId, { status: 'approved', remarks });

    await emailProfileUpdateApproved({
        req,
        corporateUserId: corporateUser,
        employeeId: request.employee,
        updatedFields: TYPE_LABELS[request.type] || request.type,
        logTraceId: req?.LogTraceId,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Profile update request approved successfully',
        data: result,
    });
});

exports.rejectProfileUpdateRequest = asyncHandler(async (req, res, next) => {
    const corporateUser = req.user._id;
    const { requestId } = req.params;
    const { remarks } = req.body;

    const request = await findProfileRequestByIdForCorporate(corporateUser, requestId);
    if (!request) return next(new ErrorResponse('Profile update request not found', 404));
    if (request.status !== 'requestedByEmployee') {
        return next(new ErrorResponse(`Request already ${request.status}`, 400));
    }

    const result = await updateProfileRequestStatus(corporateUser, requestId, { status: 'rejected', remarks });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Profile update request rejected successfully',
        data: result,
    });
});

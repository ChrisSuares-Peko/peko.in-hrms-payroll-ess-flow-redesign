const asyncHandler = require("../middleware/async");
const HrSettings = require('../models/entities/hrSettings');
const CorporateUser = require('../models/entities/corporateUser');
const ErrorResponse = require('../utils/error-response');
const { updateHrSetting, hrSettingsUpdate, updateExistingHrSettings, updateWpsFields, updateOnboardingDocuments, updateGracePeriod, updateCheckInOutStatus, updateDefaultWorkSchedule, findOneHrSettings } = require("../models/use-cases/hrSettings");
const { sanitizeBody } = require('../utils/tenantScope');
const emailer = require("../utils/email/emailer");
const { customLog } = require("../utils/loggerHelper");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const {
    companyInfoUpdated,
    leaveSettingsUpdated,
    attendanceSettingsUpdated,
    onboardingDocumentsUpdated,
} = require("../utils/email/emailTemplates/settingsUpdated");

const CORPORATE_HR_SETTINGS_PATH = "/payroll/HR-settings";
const FRONTEND_BASE_URL_FOR_SETTINGS = process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_URL
    : process.env.FRONTEND_STAGING_URL;

const SETTINGS_UPDATED_TEMPLATE = {
    payroll: companyInfoUpdated,
    leave: leaveSettingsUpdated,
    attendance: attendanceSettingsUpdated,
    onboardingDocuments: onboardingDocumentsUpdated,
};
const SETTINGS_UPDATED_KEY = {
    payroll: PAYROLL_EMAIL_TEMPLATE_KEYS.COMPANY_INFO_UPDATED,
    leave: PAYROLL_EMAIL_TEMPLATE_KEYS.LEAVE_SETTINGS_UPDATED,
    attendance: PAYROLL_EMAIL_TEMPLATE_KEYS.ATTENDANCE_SETTINGS_UPDATED,
    onboardingDocuments: PAYROLL_EMAIL_TEMPLATE_KEYS.ONBOARDING_DOCUMENTS_UPDATED,
};
const SETTINGS_UPDATED_SUBJECT = {
    payroll: 'Your company information has been updated',
    leave: 'Your leave settings have been updated',
    attendance: 'Your ESS settings have been updated',
    onboardingDocuments: 'Your ESS settings have been updated',
};

// Confirm to the corporate/HR admin that their settings were saved.
// Best-effort: a mail failure must never fail the settings update.
async function emailSettingsUpdated({ req, corporateUserId, kind = "payroll", logTraceId }) {
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
        const viewUrl = FRONTEND_BASE_URL_FOR_SETTINGS ? `${FRONTEND_BASE_URL_FOR_SETTINGS}${CORPORATE_HR_SETTINGS_PATH}` : '';

        const templateFn = SETTINGS_UPDATED_TEMPLATE[kind];
        const resolved = await resolveDynamicEmail({
            req,
            key: SETTINGS_UPDATED_KEY[kind],
            variables: {
                adminName: companyName || 'Team',
                branding: companyName || 'Peko',
                ctaUrl: viewUrl,
                ...v2LayoutVariables(branding),
            },
            fallbackSubject: SETTINGS_UPDATED_SUBJECT[kind],
            fallbackHtml: templateFn({ adminName: companyName, viewUrl }, branding),
            partnerId: req.user?.registeredBy || null,
        });
        const response = await emailer.email(corporateUser.email, resolved.subject, resolved.html);
        if (!response?.status) {
            customLog(logTraceId, "error", { message: "Failed to send settings-updated email", error: response?.message });
        }
    } catch (error) {
        customLog(logTraceId, "error", { message: "Failed to send settings-updated email", error: error?.message });
    }
}

exports.getHrSettings = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    if (!existingHrSettings) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Retrieved HR settings successfully',
            data: {}
        })
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved HR settings successfully',
        data: existingHrSettings
    });

})

exports.payrollSettings = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });
    const isFreeZoneCompany = req?.user?.isFreeZoneCompany
    if (!existingHrSettings) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Retrieved HR settings successfully',
            data: {}
        })
    }
    const { officialDocuments, payrollSettings } = existingHrSettings

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved Payroll settings successfully',
        data: { officialDocuments, payrollSettings, isFreeZoneCompany }
    });

})

exports.leaveSettings = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    if (!existingHrSettings) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Retrieved HR settings successfully',
            data: {}
        })
    }
    const { leaveSettings } = existingHrSettings

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved leave settings successfully',
        data: { leaveSettings }
    });

})

exports.updateHrSettings = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });
    const { leaveSettings, gratuitySettings, officialDocuments, companyDetails } = req.body;
    const hrSettingsData = {
        corporateUser: corporateUserID,
        leaveSettings,
        gratuitySettings,
        officialDocuments
    };

    // step-1 update corporate details with companyDetails
    // Identity, WPS and onboarding state are managed server-side, never from this payload.
    const updatedUser = await CorporateUser.findOneAndUpdate({ _id: corporateUserID }, sanitizeBody(companyDetails, ['email', 'wps', 'onboardStatus']), { new: true });
    if (!updatedUser) {
        return next(new ErrorResponse('HR setting faild,Error in updating corporate details', 400))
    }

    if (existingHrSettings) { // Update existing HR settings
        //salaryCycleDay not editable
        hrSettingsData.leaveSettings.salaryCycleDay = existingHrSettings.leaveSettings.salaryCycleDay
        const updatedHrSettings = await updateHrSetting(corporateUserID, hrSettingsData);
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'HR settings updated successfully',
            data: updatedHrSettings
        });
    } else { // Create new HR settings
        const newHrSettings = new HrSettings(hrSettingsData);
        const savedHrSettings = await newHrSettings.save();
        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'HR settings created successfully',
            data: savedHrSettings
        });
    }

})

exports.updatePayrollSettings = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });
    const { officialDocuments, isFreeZoneCompany, payrollSettings } = req.body;

    // step-1 update corporate details with companyDetails
    const updatedUser = await CorporateUser.findOneAndUpdate({ _id: corporateUserID }, { isFreeZoneCompany }, { new: true });
    if (!updatedUser) {
        return next(new ErrorResponse('HR setting failed,Error in updating corporate details', 400))
    }

    delete payrollSettings.isEditable
    const hrSettingsData = {
        corporateUser: corporateUserID,
        payrollSettings,
        officialDocuments
    };
    if (existingHrSettings) { // Update existing HR settings
        //salaryCycleDay not editable

        if (existingHrSettings.payrollSettings && existingHrSettings.payrollSettings.isEditable == false) {
            hrSettingsData.payrollSettings = existingHrSettings.payrollSettings
        }

        const updatedHrSettings = await hrSettingsUpdate(corporateUserID, hrSettingsData);
        const { officialDocuments, payrollSettings } = updatedHrSettings

        await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "payroll", logTraceId: req?.LogTraceId });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Payroll settings updated successfully',
            data: { officialDocuments, payrollSettings, isFreeZoneCompany }
        });
    } else { // Create new HR settings
        const newHrSettings = new HrSettings(hrSettingsData);
        const savedHrSettings = await newHrSettings.save();
        const { officialDocuments, payrollSettings } = savedHrSettings

        await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "payroll", logTraceId: req?.LogTraceId });

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Payroll settings created successfully',
            data: { officialDocuments, payrollSettings, isFreeZoneCompany }
        });
    }

})

exports.updateLeaveSettings = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    const { leaveSettings } = req.body;
    const hrSettingsData = {
        corporateUser: corporateUserID,
        leaveSettings
    };

    if (existingHrSettings) { // Update existing HR settings

        const updatedHrSettings = await updateExistingHrSettings(corporateUserID, hrSettingsData);
        const { leaveSettings } = updatedHrSettings

        await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "leave", logTraceId: req?.LogTraceId });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Leave settings updated successfully',
            data: { leaveSettings }
        });
    } else {
        return next(new ErrorResponse('To update leave settings, please ensure that payroll settings are updated first.', 404))
    }

})

exports.updateWpsSettings = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const body = req.body;

    // Use findOneAndUpdate to update the specific fields
    const updatedUser = await updateWpsFields(corporateUserID, body);
    if (!updatedUser) {
        return next(new ErrorResponse('HR setting failed, Error in updating corporate details', 400));
    }

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'WPS settings updated successfully',
        data: {
            employerReference: updatedUser.wps.employerReference || null,
            employerRoutingCode: updatedUser.wps.employerRoutingCode || null,
            employerId: updatedUser.wps.employerId || null
        }
    });

})

exports.getOnboardingDocuments = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    const persistedByKey = new Map(
        (existingHrSettings?.onboardingDocuments || []).map(doc => [doc.key, doc])
    );
    const onboardingDocuments = HrSettings.DEFAULT_ONBOARDING_DOCUMENTS.map(def => {
        const existing = persistedByKey.get(def.key);
        return existing ? { key: def.key, label: def.label, required: existing.required } : def;
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved onboarding documents successfully',
        data: { onboardingDocuments }
    });

})

exports.setOnboardingDocuments = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { onboardingDocuments } = req.body;

    if (!Array.isArray(onboardingDocuments) || !onboardingDocuments.length) {
        return next(new ErrorResponse('onboardingDocuments must be a non-empty array', 400))
    }

    const requiredByKey = onboardingDocuments.reduce((acc, doc) => {
        acc[doc.key] = !!doc.required;
        return acc;
    }, {});

    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });
    const persistedByKey = new Map(
        (existingHrSettings?.onboardingDocuments || []).map(doc => [doc.key, doc])
    );
    const catalog = HrSettings.DEFAULT_ONBOARDING_DOCUMENTS.map(def => {
        const existing = persistedByKey.get(def.key);
        return existing ? { key: def.key, label: def.label, required: existing.required } : def;
    });

    const merged = catalog.map(doc => ({
        key: doc.key,
        label: doc.label,
        required: Object.prototype.hasOwnProperty.call(requiredByKey, doc.key) ? requiredByKey[doc.key] : doc.required,
    }));

    const updated = await updateOnboardingDocuments(corporateUserID, merged);

    await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "onboardingDocuments", logTraceId: req?.LogTraceId });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Onboarding documents updated successfully',
        data: { onboardingDocuments: updated.onboardingDocuments }
    });

})

exports.getGracePeriod = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved grace period successfully',
        data: { gracePeriodMinutes: existingHrSettings?.gracePeriodMinutes ?? 0 }
    });

})

exports.setGracePeriod = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const { gracePeriodMinutes } = req.body;

    const updated = await updateGracePeriod(corporateUserID, gracePeriodMinutes);

    await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "attendance", logTraceId: req?.LogTraceId });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Grace period updated successfully',
        data: { gracePeriodMinutes: updated.gracePeriodMinutes }
    });

})

exports.getCheckInOutStatus = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved check-in/out status successfully',
        data: { checkInOutEnabled: !!existingHrSettings?.checkInOutEnabled }
    });

})

exports.setCheckInOutStatus = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const { checkInOutEnabled } = req.body;

    const updated = await updateCheckInOutStatus(corporateUserID, !!checkInOutEnabled);

    await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "attendance", logTraceId: req?.LogTraceId });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Check-in/out status updated successfully',
        data: { checkInOutEnabled: updated.checkInOutEnabled }
    });

})

exports.getDefaultWorkSchedule = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await HrSettings.findOne({ corporateUser: corporateUserID });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved default work schedule successfully',
        data: { defaultWorkSchedule: existingHrSettings?.defaultWorkSchedule || { checkInTime: '09:00', checkOutTime: '18:00' } }
    });

})

exports.setDefaultWorkSchedule = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const { checkInTime, checkOutTime } = req.body;

    const updated = await updateDefaultWorkSchedule(corporateUserID, { checkInTime, checkOutTime });

    await emailSettingsUpdated({ req, corporateUserId: corporateUserID, kind: "attendance", logTraceId: req?.LogTraceId });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Default work schedule updated successfully',
        data: { defaultWorkSchedule: updated.defaultWorkSchedule }
    });

})

exports.getWpsSettings = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;

    const user = await CorporateUser.findOne({ _id: corporateUserID });
    console.log({ user })
    if (!user) {
        return { "status": false, "responseCode": "001", "message": "User not found", "data": {} }
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'WPS settings fetched successfully',
        data: {
            employerReference: user.wps.employerReference || null,
            employerRoutingCode: user.wps.employerRoutingCode || null,
            employerId: user.wps.employerId || null
        }
    });

})
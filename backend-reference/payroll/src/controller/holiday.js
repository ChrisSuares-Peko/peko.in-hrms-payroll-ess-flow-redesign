const Holiday = require('../models/entities/holiyDay');
const asyncHandler = require("../middleware/async");
const { getHolidaysInARange } = require('../models/use-cases/holiyDay');
const { findOneHrSettings } = require('../models/use-cases/hrSettings');
const { holidayTemplate } = require('../utils/email/emailTemplates/holidayAnnouncement');
const ErrorResponse = require('../utils/error-response');
const emailer = require('../utils/email/emailer');
const { resolveDynamicEmail } = require('../services/emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { fetchPartnerBranding } = require('../services/partnerDetailsResolver');
const moment = require('moment');
const { findExistingHoliday, createHoliday, getAllActiveEmployees, findExistingHolidays } = require('../models/use-cases/holiyDay')
const { updateHoliday, getHolidaysPaginated } = require('../models/use-cases/holiyDay')


exports.createNewHoliday = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { title, isAllDay, start, end, category, sendPriorEmailDate} = req.body;
    if (new Date(start) > new Date(end)) {
        throw new ErrorResponse('Start date should not be greater than end date', 400);
    }
    const trimmedTitle = title.trim();

    // Check if a holiday with the same title, corporateUser, and start date already exists
    const existingHoliday = await findExistingHoliday(userId, trimmedTitle, start, end);

    if (existingHoliday) {
        throw new ErrorResponse('Another holiday with the same title or overlapping date exists', 409);
    }

    const savedHoliday = await createHoliday(userId, title, isAllDay, start, end, category, sendPriorEmailDate);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Holiday added successfully',
        data: savedHoliday
    });

})

exports.sendEmail = asyncHandler(async (req, res, next) => {

    const corporateUserId = req.user._id;
    // Get holiday by corporateUser and holidayId
    const holiday = await Holiday.findOne({ _id: req.params.id, corporateUser: corporateUserId });
    if (!holiday) {
        throw new ErrorResponse('Holiday not found', 404);
    }

    const allEmployeesExceptExcluded = await getAllActiveEmployees(corporateUserId);
   
    const emails = allEmployeesExceptExcluded.map(employee => employee.personalInformation?.email);

    // Fetch HR settings
    
    let hrSettings = await findOneHrSettings(corporateUserId);
    if (!hrSettings) {
        return next(new ErrorResponse('HR settings not found. Please add HR settings.', 400));
    }
    if (emails.length === 0) {
        return next(new ErrorResponse('No recipients found to send the email.Please ensure employees are added to the payroll', 400));
    }

    // Generate holiday email template
    const logo = hrSettings?.companyProfile?.companyLogo || hrSettings?.corporateUser?.logo;
    const website = hrSettings?.corporateUser?.website;
    const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    const footerBranding = isPartner ? partnerBranding?.branding : undefined;
    const resolved = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.HOLIDAY_REMINDER,
        variables: {
            formattedStartDate: moment(holiday.start).format('MMMM D, YYYY'),
            title: holiday.title || '',
            hrManagerName: hrSettings?.officialDocuments?.hrManagerName || '',
            // branding shows the employee's own corporate in the header; the footer's
            // partner-icon-hiding gate uses the genuine reseller partner's brand instead
            // (undefined when there isn't one, so icons correctly show).
            ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding }),
        },
        fallbackSubject: holiday.title || 'Next Scheduled holiday',
        fallbackHtml: holidayTemplate(holiday, hrSettings, footerBranding),
        partnerId: req.user?.registeredBy || null,
    });

    // Send email to employees
    let { status, message } = await emailer.email(emails, resolved.subject, resolved.html);
    if (!status) {
        return next(new ErrorResponse(message || 'Failed to send emails', 400));
    }

    // Update holiday document with isEmailSent true
    holiday.isEmailSent = true;
    const updatedHoliday = await holiday.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Emails sent successfully',
        data: updatedHoliday
    });

})

exports.getHolidays = asyncHandler(async (req, res) => {

    let start = req.query.start || '';
    let end = req.query.end || '';
    const corporateUserID = req.user._id; // Assuming req.user._id contains the corporateUser ID

    const holidays = await getHolidaysInARange(corporateUserID, start, end);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved Holidays for the corporateUser',
        data: { holidays }
    });

})

exports.getHolidayById = asyncHandler(async (req, res) => {

    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
    const holiday = await Holiday.findOne({ _id: req.params.id, corporateUser: userId });
    if (!holiday) {
        throw new ErrorResponse('Holiday not found', 404);
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved Holiday',
        data: holiday
    });

})

exports.getHolidayForCorporate = asyncHandler(async (req, res) => {

    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
    const { title, isAllDay, start, end, category, sendPriorEmailDate } = req.body;
    const holidayId = req.params.id;
    const trimmedTitle = title.trim();
    // Check if another holiday exists with the same title, start, or end date for the current user
    const existingHoliday = await findExistingHolidays(userId, holidayId, trimmedTitle, start, end);

    if (existingHoliday) {
        throw new ErrorResponse('Another holiday with the same title or overlapping date exists', 409);
    }
    // Update the Holiday only if it belongs to the current user
    const updatedHoliday = await updateHoliday(userId, holidayId, trimmedTitle, isAllDay, start, end, category, sendPriorEmailDate);
    if (!updatedHoliday) {
        throw new ErrorResponse('Holiday not found or unauthorized', 404);
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Holiday updated successfully',
        data: updatedHoliday
    });

})

// Paginated/searchable holiday listing (used by the corporate Timesheet page).
exports.listHolidays = asyncHandler(async (req, res) => {
    const corporateUser = req.user._id.toString();
    const { start, end, search, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const { holidays, total } = await getHolidaysPaginated(corporateUser, { start, end, search, category, page, limit });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Holidays retrieved successfully',
        data: { holidays },
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
});

exports.deleteHolidayById = asyncHandler(async (req, res) => {

    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
    const deletedHoliday = await Holiday.findOneAndDelete({ _id: req.params.id, corporateUser: userId });

    if (!deletedHoliday) {
        throw new ErrorResponse('Holiday not found', 404);
    }
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Holiday deleted successfully',
        data: deletedHoliday
    });

})
const asyncHandler = require("../middleware/async");
const Holiday = require("../models/entities/holiyDay");
const { getEmployeesByBirthday, getUpComingDocExpiries, getUpcomingHolidays, getAllEmployees } = require("../models/use-cases/calendarActivities");
const { getEndOfDay } = require("../utils/dateUtils");
const emailer = require('../utils/email/emailer');
const {
    holidayTemplate,
} = require("../utils/email/emailTemplates/holidayAnnouncement");
const { humanReadableDate } = require("../utils/dateUtils");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const ErrorResponse = require("../utils/error-response");
const { formatDocName } = require("../services/formatDocName")
const { resolveDynamicEmail } = require("../services/emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");
const { fetchPartnerBranding } = require("../services/partnerDetailsResolver");
const moment = require("moment");
const { getProbationReviews, probationReviewActivity } = require("../models/use-cases/employee");

exports.getCalendarActivities = asyncHandler(async (req, res) => {

    let activities = [];
    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
    const holidays = await Holiday.find({ corporateUser: userId }, "title isAllDay start end category id");
    holidays.forEach((data) => {
        let { title, isAllDay, start, end, category, id } = data;
        activities.push({
            title,
            isAllDay,
            start,
            end,
            category,
            id,
            activityType: "HOLIDAY",
        });
    });
    //up coming birth days
    let comingBirthDays = await getEmployeesByBirthday(userId, 365); //show for next 1 year
    comingBirthDays.forEach((data) => {
        let { nextBirthday, fullName, id } = data;
        activities.push({
            title: `${fullName}’s birthday`,
            isAllDay: true,
            start: nextBirthday,
            end: getEndOfDay(nextBirthday),
            category: "Birthday",
            activityType: "BIRTHDAY",
            id,
            // fullName,
        });
    });

    //docs expiry
    let comingExpiries = await getUpComingDocExpiries(userId, 365); //show for next 1 year
    comingExpiries.forEach((data) => {
        let { docName, fullName, id, expiryDate } = data;
        const formattedDocName = formatDocName(docName);
        activities.push({
            title: `${fullName}’s ${formattedDocName} expiring`,
            isAllDay: true,
            start: expiryDate,
            end: getEndOfDay(expiryDate),
            category: "Document Expiry",
            activityType: "DOCUMENT",
            id: `${id}_${formattedDocName}`,
            // fullName,
        });
    });

    const probationReviews = await getProbationReviews(userId, 365);
    probationReviews.forEach((review) => {
        const { title, start } = probationReviewActivity(review);
        activities.push({
            title,
            isAllDay: true,
            start,
            end: getEndOfDay(start),
            category: "Probation Review",
            activityType: "PROBATION_REVIEW",
            id: `${review.id}_probation`,
        });
    });

    activities.sort((a, b) => new Date(a.start) - new Date(b.start));
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved all Calendar activities for the corporateUser",
        data: { calendarActivities: activities },
    });

});
exports.upCommingActivities = asyncHandler(async (req, res) => {

    const limit = parseInt(req.query.limit) || 10;
    let activities = [];
    const userId = req.user._id; // Assuming req.user._id contains the corporateUser ID
    // const upcomingHolidays = await Holiday.find({
    //   corporateUser: userId,
    //   start: { $gt: today },
    // })
    //   .limit(limit)
    //   .sort({ start: 1 });
    const upcomingHolidays = await getUpcomingHolidays(userId, 60)
    upcomingHolidays.forEach((data) => {
        let { title, start, end, id, sendPriorEmail, isEmailSent } = data;
        if (!sendPriorEmail) {
            sendPriorEmail = false;
        }
        activities.push({
            title,
            start,
            end,
            id,
            sendPriorEmail,
            isEmailSent,
            activityType: "HOLIDAY",
        });
    });
    //up coming birth days
    let comingBirthDays = await getEmployeesByBirthday(userId, 60); //show for next n days
    comingBirthDays.forEach((data) => {
        let { nextBirthday, fullName, id } = data;
        activities.push({
            title: `${fullName}’s birthday`,
            id,
            fullName,
            start: nextBirthday,
            end: getEndOfDay(nextBirthday),
            activityType: "BIRTHDAY",
        });
    });

    //docs expiry
    let comingExpiries = await getUpComingDocExpiries(userId, 60);  //show for next n days
    comingExpiries.forEach((data) => {
        let { docName, fullName, id, expiryDate } = data;
        let formattedDoc = formatDocName(docName)

        activities.push({
            title: `${fullName}’s ${formattedDoc} expiring`,
            id,
            fullName,
            start: expiryDate,
            end: getEndOfDay(expiryDate),
            activityType: "DOCUMENT",
        });
    });

    const probationReviews = await getProbationReviews(userId, 60);
    probationReviews.forEach((review) => {
        const { title, start } = probationReviewActivity(review);
        activities.push({
            title,
            id: `${review.id}_probation`,
            fullName: review.fullName,
            start,
            end: getEndOfDay(start),
            activityType: "PROBATION_REVIEW",
        });
    });

    activities.sort((a, b) => new Date(a.start) - new Date(b.start));
    const upcomingActivities = activities.slice(0, limit);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Retrieved all upcoming activities for the corporateUser",
        data: { upcomingActivities },
    });

});
exports.sentEmail = asyncHandler(async (req, res, next) => {

    const { activityId } = req.body
    const userId = req.user._id;
    const activity = await Holiday.findOne({
        _id: activityId,
        corporateUser: req.user._id,
    });

    if (!activity) {
        return next(new ErrorResponse('Activity not found', 400))
    }

    const allEmployeesExceptExcluded = await getAllEmployees(userId)

    const emails = allEmployeesExceptExcluded.map(employee => employee.personalEmail);
    if (!emails || emails.length < 1) {
        return next(new ErrorResponse('No valid emails found. It is possible that all relevant employees have been excluded or there are no active employees available.', 400))
    }

    const subject = "Its a reminder for " + activity.title
    const corporateData = await findOneHrSettings(userId)
    const params = {
        start: humanReadableDate(activity.start),
        end: humanReadableDate(activity.end),
        title: activity.title,
        fullName: "team" //here we want to loop through all or
    };
    const logo = corporateData?.companyProfile?.companyLogo || corporateData?.corporateUser?.logo;
    const website = corporateData?.corporateUser?.website;
    const companyName = corporateData?.companyProfile?.companyName || corporateData?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;
    const footerBranding = isPartner ? partnerBranding?.branding : undefined;
    const resolved = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.HOLIDAY_REMINDER,
        variables: {
            formattedStartDate: moment(activity.start).format('MMMM D, YYYY'),
            title: params.title || '',
            hrManagerName: corporateData?.officialDocuments?.hrManagerName || '',
            // branding shows the employee's own corporate in the header; the footer's
            // partner-icon-hiding gate uses the genuine reseller partner's brand instead
            // (undefined when there isn't one, so icons correctly show).
            ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding }),
        },
        fallbackSubject: subject || 'Reminder',
        fallbackHtml: holidayTemplate(params, corporateData, footerBranding),
        partnerId: req.user?.registeredBy || null,
    });
    let to = emails
    let { status, message } = await emailer.email(to, resolved.subject, resolved.html)
    if (!status) {
        return next(new ErrorResponse(message || 'Faild to send emails', 400))
    }
    //save to database
    activity.isEmailSent = true;
    activity.save();

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Activity mailed successfully',
        data: activity
    });
    
});





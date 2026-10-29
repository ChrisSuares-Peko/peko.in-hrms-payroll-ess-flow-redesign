const asyncHandler = require("../middleware/async");
const Announcement = require('../models/entities/announcement'); // Assuming this is the path to your Announcement model
const ErrorResponse = require('../utils/error-response');
const { announcementTemplate } = require('../utils/email/emailTemplates/announcement');
const { findOneHrSettings } = require('../models/use-cases/hrSettings');
const emailer = require('../utils/email/emailer');
const { resolveDynamicEmail } = require('../services/emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { fetchPartnerBranding } = require('../services/partnerDetailsResolver');
const { getAnnouncements, getEmployees, createAnnouncement, getAllEmployeesData } = require("../models/use-cases/announcement")

exports.getAllAnnouncements = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.search || '';
    const year = parseInt(req.query.year);
    const month =req.query?.month ? parseInt(req.query.month) : null;
    const order = req.query.order || 'DESC';

    const { totalAnnouncementsCount, announcements } = await getAnnouncements({ userId, page, limit, searchText, year, month, order });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Announcements fetched successfully',
        data: {
            count: totalAnnouncementsCount,
            rows: announcements
        }
    });

});

exports.getEmployee = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const employees = await getEmployees(userId);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Employees fetched successfully',
        data: { employees },
    });

})

exports.postAnnouncement = asyncHandler(async (req, res, next) => {

    const userId = req.user._id;
    const { subject, details, excludedEmployees } = req.body;

    //need to fetch employees email and name as array to send email
    const allEmployees = await getAllEmployeesData(userId,excludedEmployees);
    const emails = allEmployees.map(employee => employee?.employeeInformation?.workEmailId || employee?.personalInformation?.email );

    if (!emails || emails.length < 1) {
        return next(new ErrorResponse('No valid emails found. It is possible that there are no active employees available.', 400))
    }

    if(!emails.every((x)=>x)){
        return next(new ErrorResponse("Please add work email ID for all employees from the employee profile",400))
    }
    let hrSettings = await findOneHrSettings(userId)
    const logo = hrSettings?.companyProfile?.companyLogo || hrSettings?.corporateUser?.logo;
    const website = hrSettings?.corporateUser?.website;
    const companyName = hrSettings?.companyProfile?.companyName || hrSettings?.corporateUser?.companyName;
    const partnerBranding = await fetchPartnerBranding(req);
    const isPartner = !!req.user?.registeredBy;

    const resolved = await resolveDynamicEmail({
        req,
        key: PAYROLL_EMAIL_TEMPLATE_KEYS.ANNOUNCEMENT,
        variables: {
            fullName: req.body?.fullName || 'Employee',
            details: details || 'Content',
            hrManagerName: hrSettings?.officialDocuments?.hrManagerName || 'HR',
            // branding shows the employee's own corporate in the header; the footer's
            // partner-icon-hiding gate uses the genuine reseller partner's brand instead
            // (undefined when there isn't one, so icons correctly show).
            ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding: isPartner ? partnerBranding?.branding : undefined }),
        },
        fallbackSubject: subject || 'Announcement',
        fallbackHtml: announcementTemplate(req.body, hrSettings, isPartner ? partnerBranding?.branding : undefined),
        partnerId: req.user?.registeredBy || null,
    });

    let to = emails
    let { status, message } = await emailer.email(to, resolved.subject, resolved.html)
    if (!status) {
        return next(new ErrorResponse(message || 'Faild to send emails', 400))
    }
    //save to database
    const savedAnnouncement = await createAnnouncement(userId, subject, details,excludedEmployees);


    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Announcement mailed successfully',
        data: savedAnnouncement
    });

})

exports.deleteAnnouncement = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const announcementId = req.params.id;

    const deleteAnnouncement = await Announcement.findOneAndDelete({ _id: announcementId, corporateUser: userId });

    if (deleteAnnouncement) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Announcement deleted successfully',
            data: {}
        });
    } else {
        return res.status(400).json({
            status: true,
            responseCode: '001',
            message: 'Something went wrong while deleting announcement',
            data: {}
        });
    }

})
const { employeeWelcomeEmailTemplate, employeeWelcomeEmail } = require("../utils/email/emailTemplates/employee");
const emailer = require('../utils/email/emailer');
const Employee = require("../models/entities/employee");
const { resolveDynamicEmail } = require('./emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');
const { fetchPartnerBranding } = require('./partnerDetailsResolver');

const EMPLOYEE_WELCOME_HERO_IMAGE = 'https://d2fduk7g9mvyjq.cloudfront.net/common/new_join.png';


exports.sendWelcomeEmails = async (req, savedEmployee, corporateUser, logo, companyName="Team") => {
    try {
        // White-label partner employees get the partner's logo/site, like the "added to payroll" email
        const partner = req?.user?.registeredBy ? await fetchPartnerBranding(req) : null;
        const headerLogo = partner?.logo || logo;
        const website = partner?.website || 'https://in.peko.one';
        // Credits the "Refer a business" link to whoever added this employee (the
        // HR/corporate admin), matching others MS's referThroughEmail/getOnboardingProgress
        // referral-link pattern.
        const referralCode = req?.user?.username;
        // Genuine reseller partner brand (if any) - gates the footer's social
        // icons/app-badges separately from companyName, which just personalizes the header.
        const footerBranding = partner?.branding;

        // If you need to perform actions on all other employees
        const allEmployeesExceptSaved = await Employee.find({
            corporateUser,
            _id: { $ne: savedEmployee._id }
        });

        let subject = 'Welcome Our New Team Member.'
        let employeeName = savedEmployee.personalInformation?.fullName

        let body = employeeWelcomeEmailTemplate(employeeName, companyName, headerLogo, website, referralCode, footerBranding)
        // Map the result to get all email addresses
        const allEmployeeEmails = allEmployeesExceptSaved
            .map(employee => employee.personalInformation?.email)
            .filter(Boolean);

        // for sending welcome email of new employee to other employees
        if (allEmployeeEmails.length) {
            await emailer.email(allEmployeeEmails, subject, body)
        }
        // for sending welcome email for new employee
        let employeeEmail = savedEmployee.personalInformation?.email
        const resolved = await resolveDynamicEmail({
            req,
            key: PAYROLL_EMAIL_TEMPLATE_KEYS.EMPLOYEE_WELCOME,
            variables: {
                employeeName,
                organizationName: companyName,
                heroImage: EMPLOYEE_WELCOME_HERO_IMAGE,
                // branding shows the employee's own corporate in the header; the footer's
                // partner-icon-hiding gate uses the genuine reseller partner's brand
                // instead (undefined when there isn't one, so icons correctly show).
                ...v2LayoutVariables({ website: partner?.website || req?.user?.website, logo: headerLogo, branding: companyName, footerBranding }),
            },
            fallbackSubject: `Welcome to ${companyName}`,
            fallbackHtml: employeeWelcomeEmail(employeeName, headerLogo, companyName, website, referralCode, footerBranding),
            partnerId: req?.user?.registeredBy || null,
        });

        await emailer.email(employeeEmail, resolved.subject, resolved.html)
        return { status: true, message: 'Emails sent successfully' };

    } catch (error) {
        console.error('Error sending emails:', error);
        return { status: false, message: 'Error sending emails' };
    }
}
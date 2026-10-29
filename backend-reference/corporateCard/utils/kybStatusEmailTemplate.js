const [{ logo: PEKO_LOGO_URL }] = require('../public/partnerLogos');
const { socialIconCells, PEKO_SOCIAL_LINKS, websiteLabel, v2Header, v2Footer } = require('./emailTemplate/sharedLayout');

const getServiceUrl = () => {
    if (process.env.NODE_ENV === 'staging') {
        return process.env.FRONTEND_STAGING_URL || 'https://uatin.pekoapp.com';
    }
    return process.env.FRONTEND_PRODUCTION_URL || 'https://in.peko.one';
};

const LEGAL_ENTITY = 'Peko Platforms Private Limited';

const POLICY_LINKS = [
    { label: 'Privacy Policy', href: 'https://peko.one/in/privacy-policy/' },
    { label: 'Cookie Policy', href: 'https://peko.one/in/cookie-policy/' },
    { label: 'Terms of Use', href: 'https://peko.one/in/platform-agreement' },
    { label: 'Refund & Cancellation Policy', href: 'https://peko.one/in/refund-policy' },
];

const FOOTER_MAILBOX = 'reach@peko.one';

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const reviewDayLabel = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
    });
};

const paragraph = (text, extra = '') =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#6B7280;font-size:15px;padding-bottom:16px${extra}">${text}</p>`;

const sectionLabel = (text) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:22px;color:#111827;font-size:15px;font-weight:700;padding-bottom:8px">${text}</p>`;

const bulletList = (items) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
        ${items.map((item) => `
        <tr>
            <td valign="top" style="width:16px;padding:0 0 6px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">&#8226;</td>
            <td valign="top" style="padding:0 0 6px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:15px;line-height:22px">${item}</td>
        </tr>`).join('')}
    </table>`;

const detailsTable = (rows) => `
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin:0 0 16px 0">
        ${rows.map(([label, value]) => `
        <tr>
            <td valign="top" style="width:40%;padding:0 12px 12px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#111827;font-size:14px;line-height:20px;font-weight:700">${label}:</td>
            <td valign="top" style="padding:0 0 12px 0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;color:#6B7280;font-size:14px;line-height:20px">${value}</td>
        </tr>`).join('')}
    </table>`;

const inlineDetail = (label, value) =>
    `<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:22px;color:#6B7280;font-size:14px;padding-bottom:16px"><b style="color:#111827">${label}:</b> ${value}</p>`;

// Header/footer chrome delegated to sharedLayout.js's v2Header/v2Footer — same code
// every other migrated microservice's templates call, for consistency (explicit
// user decision: code consistency over an exact pixel-match to this MS's own Figma
// mockups, which use a different, one-off header/footer style).
const buildKybStatusEmail = ({ title, iconGlyph, iconColor, iconBg, iconImageUrl, headline, paragraphHtml, buttonLabel, buttonHref, preheader, signOff, disclaimerHtml }) => {
    const website = getServiceUrl();
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>${title}</title>
    <style type="text/css">
        img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
    </style>
</head>
<body style="font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;background-color:#F9FAFB">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${preheader || headline}</div>
${v2Header({ website, websiteLabel: websiteLabel(website), logo: PEKO_LOGO_URL, branding: 'Peko' })}
<div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background-color:#F9FAFB">
    <tr>
        <td align="center" style="padding:0 16px">
            <table width="100%" cellspacing="0" cellpadding="0"
                style="width:100%;border-collapse:collapse">
                <!-- Content -->
                <tr>
                    <td style="padding:0">
                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;background-color:#ffffff;border-radius:18px">
                            <tr>
                                <td style="padding:32px;border-radius:18px">
                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">
                            ${(iconImageUrl || iconGlyph) ? `<tr>
                                <td style="padding-bottom:20px">
                                    ${iconImageUrl ? `<img src="${iconImageUrl}" width="66" height="66" alt=""
                                        style="display:block;border:0;outline:none;text-decoration:none;width:66px;height:66px">` : `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                                        <tr>
                                            <td align="center" valign="middle" bgcolor="${iconBg}"
                                                style="width:66px;height:66px;border-radius:33px;background-color:${iconBg}">
                                                <table cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                                                    <tr>
                                                        <td align="center" valign="middle" bgcolor="${iconColor}"
                                                            style="width:48px;height:48px;border-radius:24px;background-color:${iconColor};font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-size:26px;font-weight:900;line-height:48px;color:#ffffff">
                                                            ${iconGlyph}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>`}
                                </td>
                            </tr>` : ''}
                            <tr>
                                <td style="padding-bottom:20px">
                                    <h1 style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:32px;color:#111827;font-size:24px;font-weight:700">
                                        ${headline}
                                    </h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-bottom:4px">
                                    ${paragraphHtml}
                                </td>
                            </tr>
                            ${buttonLabel ? `<tr>
                                <td style="padding-top:8px;padding-bottom:8px">
                                    <span style="mso-line-height-rule:exactly;text-decoration:none;display:inline-block;box-sizing:border-box;border-radius:8px;background-color:#FF4F4F;padding:13px 28px;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-weight:600;font-size:15px;line-height:20px;color:#ffffff;text-align:center">
                                        <a target="_blank" href="${buttonHref || getServiceUrl()}" style="text-decoration:none;color:#ffffff;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;font-weight:600;font-size:15px">${buttonLabel}</a>
                                    </span>
                                </td>
                            </tr>` : ''}
                            <tr>
                                <td style="padding-top:20px">
                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:22px;color:#374151;font-size:15px">
                                        ${signOff || 'Best regards,<br>Team Peko'}
                                    </p>
                                </td>
                            </tr>
                            ${disclaimerHtml ? `<tr>
                                <td style="padding-top:20px">
                                    <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#9CA3AF;font-size:12px">
                                        ${disclaimerHtml}
                                    </p>
                                </td>
                            </tr>` : ''}
                        </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</div>
${v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS) })}
</body>
</html>
`;
};
exports.escapeHtml = escapeHtml;
exports.detailsTable = detailsTable;
exports.inlineDetail = inlineDetail;
exports.reviewDayLabel = reviewDayLabel;
exports.getServiceUrl = getServiceUrl;
exports.LEGAL_ENTITY = LEGAL_ENTITY;
exports.POLICY_LINKS = POLICY_LINKS;
exports.socialIconCells = socialIconCells;
exports.PEKO_SOCIAL_LINKS = PEKO_SOCIAL_LINKS;
exports.PEKO_LOGO_URL = PEKO_LOGO_URL;

exports.buildKybStatusEmail = buildKybStatusEmail;
// Exposed for controllers/systemUser/corporateCardApplication.js's resolve wrappers,
// which pre-render these into HTML fragments for the admin-managed templates'
// ${...} placeholders (no loop/conditional syntax inside stored HTML).
exports.sectionLabel = sectionLabel;
exports.bulletList = bulletList;

const FUNDING_ACCOUNT_ROWS = [
    ['clientName', 'Client name'],
    ['beneficiaryName', 'Beneficiary Name'],
    ['bankName', 'Bank Name'],
    ['accountNumber', 'Account Number'],
    ['ifsc', 'IFSC Code'],
    ['bankAddress', 'Bank Address'],
    ['telephone', 'Telephone'],
];

const fundingAccountSection = (details) => {
    const rows = FUNDING_ACCOUNT_ROWS
        .map(([key, label]) => [label, String(details?.[key] ?? '').trim()])
        .filter(([, value]) => value)
        .map(([label, value]) => [label, escapeHtml(value)]);

    if (!rows.length) return '';

    return sectionLabel('Beneficiary &amp; Bank Details') + detailsTable(rows);
};
exports.fundingAccountSection = fundingAccountSection;

// Figma: "Application approved" (node 4214:5812, Peko-Corporate-Cards). No icon
// badge in this design — the frame opens on a dashboard/activation walkthrough
// mockup image instead, omitted here (a real asset would be needed, not built from
// scratch); reminder pending, per the user. fundingAccountSection/kybReference are
// real functional content Figma's static mockup can't depict, kept as-is below the
// Figma-matching core copy.
exports.kybApprovedTemplate = ({ name, kybReference, fundingAccount } = {}) => {
    const paragraphHtml = [
        paragraph(`Dear ${escapeHtml(name)},`),
        paragraph("Congratulations! We're delighted to inform you that your Peko corporate card application has been successfully approved!"),
        paragraph('You can now login and fund your account using the button below:'),
        fundingAccountSection(fundingAccount),
        kybReference ? inlineDetail('Reference', escapeHtml(kybReference)) : '',
    ].join('');

    return buildKybStatusEmail({
        title: 'Application approved',
        headline: 'Application approved',
        paragraphHtml,
        buttonLabel: 'Login',
    });
};

const PLEASE_ENSURE_ITEMS = [
    'All uploaded documents are clear, complete, and valid.',
    'The business information matches the submitted supporting documents.',
    'Any requested corrections are addressed before resubmission.',
];
exports.PLEASE_ENSURE_ITEMS = PLEASE_ENSURE_ITEMS;

// Figma: "Peko corporate card application update" (node 4232:12684, Peko-Corporate-Cards).
// No icon badge, no button. Figma's copy has no phone number for support — the
// codebase has no real support phone number anywhere to reference, so this keeps
// the existing email-only contact convention rather than inventing one.
// reasonItems/"Please ensure that" are real functional content (only rendered when
// data exists) Figma's static mockup can't depict, kept below the Figma-matching core copy.
exports.kybRejectedTemplate = (name, rejectionReason) => {
    const reasonItems = (rejectionReason || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const paragraphHtml = [
        paragraph(`Dear ${escapeHtml(name)},`),
        paragraph('Thank you for your interest in the Peko corporate card. After careful review, we regret to inform you that your application has <b style="color:#F90000">not been approved at this time.</b>'),
        paragraph(`If you would like to discuss this decision, or need further information on eligibility requirements, please contact us at <a href="mailto:${FOOTER_MAILBOX}" style="color:#6B7280;text-decoration:underline">${FOOTER_MAILBOX}</a>.`),
        paragraph('We appreciate your interest and encourage you to apply again in the future.'),
        reasonItems.length ? sectionLabel('Reason(s) for Rejection:') : '',
        reasonItems.length ? bulletList(reasonItems) : '',
        reasonItems.length ? sectionLabel('Please ensure that:') : '',
        reasonItems.length ? bulletList(PLEASE_ENSURE_ITEMS) : '',
    ].join('');

    return buildKybStatusEmail({
        title: 'Peko corporate card application update',
        headline: 'Peko corporate card application update',
        paragraphHtml,
    });
};

const VENDOR_OPS_MAILBOX = 'reach@peko.one';

const VENDOR_REVIEW_ACTIONS = [
    'Run your KYB checks on the entity and on the document pack shared with you for this reference.',
    'Confirm the outcome to Peko, or list what is missing so we can go back to the corporate.',
    'Quote the KYB reference on every reply so we can match it to the right application.',
];

exports.vendorKybUnderReviewTemplate = ({ companyName, kybReference, businessTypeLabel, movedToReviewOn, attached = [], omitted = [], archiveName = 'KYB-Documents.zip' }) => {
    const company = escapeHtml(companyName) || 'A corporate';
    const reference = escapeHtml(kybReference);
    const entityType = escapeHtml(businessTypeLabel);
    const reviewedOn = escapeHtml(reviewDayLabel(movedToReviewOn));

    const details = [
        `<b>Corporate:</b> ${company}`,
        reference ? `<b>KYB reference:</b> ${reference}` : '',
        entityType ? `<b>Entity type:</b> ${entityType}` : '',
        reviewedOn ? `<b>Moved to review on:</b> ${reviewedOn}` : '',
    ].filter(Boolean);

    const paragraphHtml = [
        paragraph('Hello,'),
        paragraph(`${company} has completed its Corporate Cards KYB submission on Peko, and it has now been moved to review.`),
        sectionLabel('Application details'),
        bulletList(details),
        sectionLabel('What we need from you'),
        bulletList(VENDOR_REVIEW_ACTIONS),
        attached.length ? sectionLabel('Documents attached to this email') : '',
        attached.length ? paragraph(`Attached as a single zip file, <b>${escapeHtml(archiveName)}</b>, containing:`) : '',
        attached.length ? bulletList(attached.map((label) => escapeHtml(label))) : '',
        omitted.length ? sectionLabel('Not attached — please request these separately') : '',
        omitted.length ? bulletList(omitted.map((label) => escapeHtml(label))) : '',
        paragraph('These documents are confidential and contain personal information. Please handle them under our agreed data protection terms and do not forward this email.'),
        paragraph(`Please send your outcome or any queries to <a href="mailto:${VENDOR_OPS_MAILBOX}" style="color:#FF4F4F;text-decoration:underline">${VENDOR_OPS_MAILBOX}</a>.`),
    ].join('');

    return buildKybStatusEmail({
        title: 'KYB Review Requested',
        iconGlyph: '&#33;',
        iconColor: '#D97706',
        iconBg: '#FFFBEB',
        headline: 'A KYB submission is ready for your review',
        preheader: `${company}${reference ? ` (${reference})` : ''} is awaiting KYB review.`,
        paragraphHtml,
    });
};

exports.kybSubmittedAdminTemplate = ({ companyName, contactPersonName, contactEmail, contactMobile, kybReference, businessTypeLabel, submittedOn, reviewUrl } = {}) => {
    const company = escapeHtml(companyName || 'A corporate');

    const details = [
        ['Company', escapeHtml(companyName || '-')],
        ['Contact person', escapeHtml(contactPersonName || '-')],
        ['Contact email', escapeHtml(contactEmail || '-')],
        ['Contact mobile', escapeHtml(contactMobile || '-')],
        ['Business type', escapeHtml(businessTypeLabel || '-')],
        ['Reference', escapeHtml(kybReference || '-')],
        ['Submitted on', escapeHtml(submittedOn || '-')],
    ];

    const paragraphHtml = [
        paragraph('Hello,'),
        paragraph(`${company} has just submitted its Corporate Cards KYB application. It is waiting in the review queue.`),
        sectionLabel('Application details'),
        detailsTable(details),
        paragraph('Open the Corporate Card Applications screen to review the documents and record a decision.'),
    ].join('');

    return buildKybStatusEmail({
        title: 'KYB Application Submitted',
        iconGlyph: '&#33;',
        iconColor: '#D97706',
        iconBg: '#FFFBEB',
        headline: 'A new KYB application is waiting for review',
        preheader: `${company}${kybReference ? ` (${kybReference})` : ''} submitted a KYB application.`,
        paragraphHtml,
        ...(reviewUrl ? { buttonLabel: 'Review application', buttonHref: reviewUrl } : {}),
    });
};

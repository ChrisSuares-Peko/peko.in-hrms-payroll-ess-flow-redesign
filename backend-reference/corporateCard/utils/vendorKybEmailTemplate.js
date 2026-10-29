const {
    escapeHtml,
    reviewDayLabel,
    getServiceUrl,
    PEKO_LOGO_URL,
} = require('./kybStatusEmailTemplate');
const { socialIconCells, PEKO_SOCIAL_LINKS, websiteLabel, v2Header, v2Footer } = require('./emailTemplate/sharedLayout');

const VENDOR_OPS_MAILBOX = 'miscc.in@peko.in';

// Kept for utils/__tests__/vendorKybEmailTemplate.test.js, which checks the body's
// own vendor contact line — same value as VENDOR_OPS_MAILBOX. The generic footer's
// support line now comes from v2Footer's fixed help@peko.one, same as every other
// microservice's footer.
const FOOTER_MAILBOX = VENDOR_OPS_MAILBOX;

const VENDOR_REVIEW_ACTIONS = [
    'Verify the corporate entity and its registration details.',
    'Verify the submitted KYB information against the relevant records.',
    'Review the attached supporting documents for completeness and validity.',
    'Highlight any discrepancies, missing information, or additional documents required.',
    'Confirm the KYB verification outcome once the review is completed.',
];

const FONT = "-apple-system, 'Segoe UI', Roboto, helvetica, 'helvetica neue', arial, verdana, sans-serif";

const INK = '#111827';
const BODY_INK = '#1F2937';
const MUTED = '#4B5563';
const GROUND = '#F9FAFB';
const CARD = '#ffffff';

const textReset = 'Margin:0;mso-line-height-rule:exactly;-webkit-text-size-adjust:none;-ms-text-size-adjust:none';

const TABLE_RESET = 'border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt';

const para = (html, { size = 16, lineHeight = 24, color = BODY_INK, bottom = 16, weight = 400 } = {}) =>
    `<p style="${textReset};font-family:${FONT};font-size:${size}px;line-height:${lineHeight}px;font-weight:${weight};color:${color};padding:0 0 ${bottom}px 0">${html}</p>`;

const heading = (text) =>
    `<p class="pk-h2" style="${textReset};font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:${INK};padding:8px 0 12px 0">${text}</p>`;

const bullets = (items, bottom = 16) => `
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="${TABLE_RESET};width:100%">
                                ${items.map((item, index) => `
                                <tr>
                                    <td valign="top" width="18" style="width:18px;padding:0 0 ${index === items.length - 1 ? bottom : 8}px 0;font-family:${FONT};font-size:16px;line-height:24px;color:${BODY_INK}">&#8226;</td>
                                    <td valign="top" style="padding:0 0 ${index === items.length - 1 ? bottom : 8}px 0;font-family:${FONT};font-size:16px;line-height:24px;color:${BODY_INK}">${item}</td>
                                </tr>`).join('')}
                            </table>`;

const detailRows = (rows) => `
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="${TABLE_RESET};width:100%">
                                ${rows.map(({ label, value }) => `
                                <tr>
                                    <td class="pk-stack" valign="top" width="46%" style="width:46%;padding:0 12px 12px 0;font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${INK}">${label}</td>
                                    <td class="pk-stack pk-stack-last" valign="top" style="padding:0 0 12px 0;font-family:${FONT};font-size:16px;line-height:24px;color:${BODY_INK}">${value}</td>
                                </tr>`).join('')}
                            </table>`;

// Header/footer chrome delegated to sharedLayout.js's v2Header/v2Footer — same code
// every other migrated microservice's templates call, for consistency (explicit
// user decision: code consistency over an exact pixel-match to this MS's own Figma
// mockups, which use a different, one-off header/footer style).
const buildPekoEmail = ({ title, preheader, bodyHtml }) => { const website = getServiceUrl(); return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no,date=no,address=no,email=no" name="format-detection">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(title)}</title>
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <style>td,div,h1,p,a,span{font-family:Arial,Helvetica,sans-serif !important}</style>
    <![endif]-->
    <style type="text/css">
        img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
        table{border-collapse:collapse !important}
        a{color:${MUTED}}
        @media only screen and (max-width:620px) {
            .pk-shell{width:100% !important;max-width:100% !important}
            .pk-pad{padding-left:16px !important;padding-right:16px !important}
            .pk-card-pad{padding:24px 18px !important}
            .pk-h1{font-size:24px !important;line-height:30px !important}
            .pk-h2{font-size:18px !important;line-height:26px !important}
            .pk-stack{display:block !important;width:100% !important;padding-right:0 !important;padding-bottom:2px !important}
            .pk-stack-last{padding-bottom:14px !important}
            .pk-site{display:none !important}
        }
    </style>
</head>
<body style="width:100%;padding:0;Margin:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:${GROUND}">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}${'&zwnj;&nbsp;'.repeat(16)}</div>
${v2Header({ website, websiteLabel: websiteLabel(website), logo: PEKO_LOGO_URL, branding: 'Peko' })}
<div style="background:${GROUND};background-color:${GROUND};margin:0px auto;max-width:680px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${GROUND}" style="${TABLE_RESET};width:100%;background-color:${GROUND}">
    <tr>
        <td align="center" class="pk-pad" style="padding:0 24px">
            <!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="${TABLE_RESET}"><tr><td><![endif]-->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="pk-shell" style="${TABLE_RESET};width:100%">
                <tr>
                    <td style="padding:0">
                        <!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${CARD}" style="${TABLE_RESET};width:100%"><tr><td style="padding:32px 24px"><![endif]-->
                        <!--[if !mso]><!-->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="${TABLE_RESET};width:100%;background-color:${CARD};border-radius:18px">
                            <tr>
                                <td class="pk-card-pad" style="padding:32px 24px;border-radius:18px">
                        <!--<![endif]-->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="${TABLE_RESET};width:100%">
                                        ${bodyHtml}
                                    </table>
                        <!--[if !mso]><!-->
                                </td>
                            </tr>
                        </table>
                        <!--<![endif]-->
                        <!--[if mso]></td></tr></table><![endif]-->
                    </td>
                </tr>
            </table>
            <!--[if mso]></td></tr></table><![endif]-->
        </td>
    </tr>
</table>
</div>
${v2Footer({ socials: socialIconCells(PEKO_SOCIAL_LINKS, { padding: '0 11px' }) })}
</body>
</html>
`; };

const row = (html) => `<tr><td style="padding:0">${html}</td></tr>`;

const vendorKybUnderReviewTemplate = ({
    companyName,
    kybReference,
    businessTypeLabel,
    applicationId,
    applicationDate,
    registrationNumber,
    jurisdiction,
    recipientName,
    attached = [],
}) => {
    const company = escapeHtml(companyName) || 'A corporate';
    const reference = escapeHtml(kybReference);
    const greeting = escapeHtml(recipientName) || 'Partner';

    const details = [
        { label: 'Company name:', value: company },
        { label: 'Application ID:', value: escapeHtml(applicationId) },
        { label: 'Date of application:', value: escapeHtml(reviewDayLabel(applicationDate)) },
        { label: 'Entity Type:', value: escapeHtml(businessTypeLabel) },
        { label: 'Registration number:', value: escapeHtml(registrationNumber) },
        { label: 'Registered country/Jurisdiction:', value: escapeHtml(jurisdiction) },
        { label: 'KYB reference:', value: reference },
    ].filter(({ value }) => value);

    const bodyHtml = [
        row(`<p class="pk-h1" style="${textReset};font-family:${FONT};font-size:32px;line-height:40px;font-weight:700;color:#000000;padding:0 0 24px 0">KYB Verification Request &ndash; Corporate Card Application</p>`),
        row(para(`Dear ${greeting},`)),
        row(para('A customer has submitted a corporate card application through our platform. We request your assistance in reviewing and verifying the applicant&rsquo;s KYB details and supporting documentation.')),
        row(para('Please find the application information and supporting documents for your review.')),
        row(heading('Application details')),
        row(detailRows(details)),
        row(heading('What we need from you')),
        row(para('Please review the applicant&rsquo;s KYB information and the attached supporting documents, and confirm whether the submitted details meet the required verification criteria.', { bottom: 8 })),
        row(bullets(VENDOR_REVIEW_ACTIONS)),
        attached.length ? row(heading('Documents attached to this email')) : '',
        attached.length ? row(bullets(attached.map((label) => escapeHtml(label)))) : '',
        row(para('Kindly complete the verification and share your findings with us at your earliest convenience. If you require any additional information or documentation from the applicant, please let us know so we can coordinate accordingly.')),
        row(para('These documents are confidential and contain personal information. Please handle them in accordance with our agreed data protection terms and do not forward this email or its attachments.')),
        row(para(`If you need assistance or have any questions, please get in touch with us at <a target="_blank" href="mailto:${VENDOR_OPS_MAILBOX}" style="color:${BODY_INK};text-decoration:underline">${VENDOR_OPS_MAILBOX}</a>.`, { bottom: 24 })),
        row(para('Best regards,<br>Team Peko', { bottom: 0 })),
    ].filter(Boolean).join('');

    return buildPekoEmail({
        title: 'KYB Verification Request',
        preheader: `${companyName || kybReference || 'A corporate'}${reference && companyName ? ` (${kybReference})` : ''} is awaiting KYB verification.`,
        bodyHtml,
    });
};

module.exports = {
    vendorKybUnderReviewTemplate,
    buildPekoEmail,
    VENDOR_OPS_MAILBOX,
    FOOTER_MAILBOX,
    VENDOR_REVIEW_ACTIONS,
    // Exposed for services/vendorKybReviewEmail.js's resolveVendorKybUnderReviewEmail,
    // which pre-renders the details table / documents list / actions list into HTML
    // fragments for the admin-managed template's ${...} placeholders (the resolver's
    // placeholder substitution has no loop/conditional syntax of its own).
    detailRows,
    bullets,
    heading,
};
